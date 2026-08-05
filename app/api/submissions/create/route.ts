// app/api/submissions/create/route.ts
import { connectDB } from "../../config/db";
import { NextResponse } from "next/server";
import Submission from "../../models/submission.models";
import problemModels from "../../models/problem.models";
import { getSessionUser } from "../../utils/auth";
import { isRateLimited } from "../../utils/rateLimit";

const MAX_CODE_LENGTH = 20_000;
const MAX_TEST_CASES = 50; // cap how many hidden cases a single submission will run
const EXEC_TIMEOUT_MS = 15_000;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(req: Request) {
  try {
    // The old route trusted a `userId` in the request body — anyone could
    // submit code (and get credit for solving problems) as any other user
    // just by changing that field. The user id must come from the verified
    // session, never from client input.
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, message: "You must be logged in to submit." },
        { status: 401 }
      );
    }

    if (isRateLimited(`submit:${sessionUser.userId}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
      return NextResponse.json(
        { success: false, message: "Too many submissions — please wait a moment before trying again." },
        { status: 429 }
      );
    }

    await connectDB();

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
    }

    const { problemId, code, language } = body ?? {};
    const userId = sessionUser.userId;

    if (!problemId || !code || !language) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 }
      );
    }
    if (typeof code !== "string" || code.length > MAX_CODE_LENGTH) {
      return NextResponse.json(
        { success: false, message: `Code must be a string under ${MAX_CODE_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const problem = await problemModels.findById(problemId);
    if (!problem) {
      return NextResponse.json(
        { success: false, message: "Problem not found." },
        { status: 404 }
      );
    }

    let finalStatus = "Accepted";
    let errorMessage = "All test cases passed.";
    let failedIndex: number | null = null;
    let totalTime = 0;

    const testCases = problem.testCases.slice(0, MAX_TEST_CASES);
    const origin = new URL(req.url).origin;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];

      let execData: any;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), EXEC_TIMEOUT_MS);
        try {
          // Call the internal execute route directly so the timeout/rate-limit
          // logic there also protects this path. We forward the session
          // cookie so /api/execute's own auth check passes.
          const execResponse = await fetch(`${origin}/api/execute`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: req.headers.get("cookie") ?? "",
            },
            body: JSON.stringify({ language, code, stdin: tc.input }),
            signal: controller.signal,
          });
          execData = await execResponse.json();
        } finally {
          clearTimeout(timeout);
        }
      } catch (fetchErr: any) {
        finalStatus = "Runtime Error";
        errorMessage = fetchErr?.name === "AbortError"
          ? `Time Limit Exceeded on test case #${i + 1}.`
          : "Execution engine unreachable.";
        failedIndex = i;
        break;
      }

      // Check for compilation / runtime errors first
      if (execData.stderr && execData.stderr.trim().length > 0) {
        // Some languages print warnings to stderr but still produce output.
        // Only treat as error if there's no stdout at all.
        if (!execData.stdout || execData.stdout.trim().length === 0) {
          finalStatus = "Compilation Error";
          errorMessage = execData.stderr.trim();
          failedIndex = i;
          break;
        }
      }

      if (execData.exception && execData.exception.trim().length > 0) {
        finalStatus = "Runtime Error";
        errorMessage = execData.exception.trim();
        failedIndex = i;
        break;
      }

      // Normalize output: trim trailing/leading whitespace and normalize line endings
      const actualOutput = normalizeOutput(execData.stdout ?? "");
      const expectedOutput = normalizeOutput(tc.output ?? "");

      totalTime += execData.executionTime ?? 0;

      if (actualOutput !== expectedOutput) {
        finalStatus = "Wrong Answer";
        errorMessage = `Failed on test case #${i + 1}.\nExpected:\n${expectedOutput}\n\nGot:\n${actualOutput}`;
        failedIndex = i;
        break;
      }
    }

    // Save to DB
    const submission = await Submission.create({
      problem: problem._id,
      user: userId,
      code,
      language,
      status: finalStatus,
      executionTime: totalTime,
      failedTestCaseIndex: failedIndex,
    });

    return NextResponse.json({
      success: true,
      status: finalStatus,
      message: errorMessage,
      submissionId: submission._id,
    });

  } catch (error: any) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error while judging submission." },
      { status: 500 }
    );
  }
}

/**
 * Normalize output for fair comparison:
 * - Trim leading/trailing whitespace
 * - Normalize \r\n to \n
 * - Trim each line (handles trailing spaces per line)
 * - Remove trailing empty lines
 */
function normalizeOutput(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")   // Windows line endings → Unix
    .replace(/\r/g, "\n")      // Old Mac line endings → Unix
    .split("\n")
    .map((line) => line.trimEnd())  // Remove trailing spaces per line
    .join("\n")
    .trim();                   // Remove leading/trailing blank lines
}
