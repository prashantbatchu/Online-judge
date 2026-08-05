// app/api/execute/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "../utils/auth";
import { isRateLimited } from "../utils/rateLimit";

const LANGUAGE_ID: Record<string, number> = {
  cpp:        54,
  c:          50,
  python:     71,
  java:       62,
  javascript: 63,
};

const MAX_CODE_LENGTH = 20_000;
const MAX_STDIN_LENGTH = 20_000;
const JUDGE0_TIMEOUT_MS = 15_000;
const RATE_LIMIT_MAX = 15;      // requests
const RATE_LIMIT_WINDOW_MS = 60_000; // per minute

const b64 = (str: string) => Buffer.from(str).toString("base64");
const unb64 = (str: string | null) => str ? Buffer.from(str, "base64").toString("utf-8") : "";

export async function POST(req: Request) {
  try {
    // Require login: this endpoint proxies to a third-party execution
    // service (Judge0), so leaving it open to anonymous callers means
    // anyone on the internet can burn through the app's Judge0 quota.
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { status: "error", stdout: "", stderr: "You must be logged in to run code.", exception: "" },
        { status: 401 }
      );
    }

    if (isRateLimited(sessionUser.userId, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
      return NextResponse.json(
        {
          status: "error", stdout: "", stderr: "Too many requests — please slow down and try again in a bit.",
          exception: "",
        },
        { status: 429 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { status: "error", stdout: "", stderr: "Invalid JSON body.", exception: "" },
        { status: 400 }
      );
    }

    const { language, code, stdin } = body ?? {};

    if (typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { status: "error", stdout: "", stderr: "No code submitted.", exception: "" },
        { status: 400 }
      );
    }
    if (code.length > MAX_CODE_LENGTH) {
      return NextResponse.json(
        { status: "error", stdout: "", stderr: `Code exceeds the ${MAX_CODE_LENGTH} character limit.`, exception: "" },
        { status: 413 }
      );
    }
    if (typeof stdin === "string" && stdin.length > MAX_STDIN_LENGTH) {
      return NextResponse.json(
        { status: "error", stdout: "", stderr: `Input exceeds the ${MAX_STDIN_LENGTH} character limit.`, exception: "" },
        { status: 413 }
      );
    }

    const languageId = LANGUAGE_ID[language];
    if (!languageId) {
      return NextResponse.json({
        status: "error", stdout: "", stderr: `Unsupported language: ${language}`, exception: "",
      }, { status: 400 });
    }

    // Guard against Judge0 hanging forever and tying up the request.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), JUDGE0_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(
        "https://ce.judge0.com/submissions?wait=true&base64_encoded=true",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language_id:  languageId,
            source_code:  b64(code),
            stdin:        b64(typeof stdin === "string" ? stdin : ""),
          }),
          signal: controller.signal,
        }
      );
    } catch (fetchErr: any) {
      if (fetchErr?.name === "AbortError") {
        return NextResponse.json({
          status: "error", stdout: "", stderr: "Execution timed out. Your code may be stuck in an infinite loop.", exception: "",
        }, { status: 504 });
      }
      console.error("Judge0 network error:", fetchErr);
      return NextResponse.json({
        status: "error", stdout: "", stderr: "Could not reach the execution engine. Please try again shortly.", exception: "",
      }, { status: 502 });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("Judge0 HTTP error:", response.status, errText);
      return NextResponse.json({
        status: "error", stdout: "", stderr: `Judge0 error ${response.status}`, exception: "",
      });
    }

    const data = await response.json();

    // Decode base64 fields
    const stdout     = unb64(data.stdout).trim();
    const compileErr = unb64(data.compile_output).trim();
    const stderr     = compileErr || unb64(data.stderr).trim();
    const statusId   = data.status?.id;

    return NextResponse.json({
      status:        statusId === 3 ? "success" : "error",
      stdout,
      stderr,
      exception:     "",
      executionTime: data.time   ? Math.round(parseFloat(data.time) * 1000) : 0,
      memoryUsed:    data.memory ?? 0,
      judge0Status:  data.status?.description ?? "",
    });

  } catch (error: any) {
    console.error("Execute API error:", error);
    return NextResponse.json({
      status: "error", stdout: "", stderr: "Internal server error.", exception: "",
    }, { status: 500 });
  }
}
