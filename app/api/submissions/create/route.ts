// import { connectDB } from "../../config/db";
// import { NextResponse } from "next/server";
// import Submission from "../../models/submission.models";
// import problemModels from "../../models/problem.models";
// import vm from "node:vm";

// // /api/submissions/create/route.ts

// export async function POST(req: Request) {
//   try {
//     await connectDB();
//     const { problemId, userId, code, language } = await req.json();

//     const problem = await problemModels.findById(problemId);
//     if (!problem) return NextResponse.json({ success: false, message: "Problem not found" }, { status: 404 });

//     let finalStatus = "Accepted";
//     let errorMessage = "All test cases passed.";

//     // 1. Loop through ALL test cases in the database
//     for (let i = 0; i < problem.testCases.length; i++) {
//       const tc = problem.testCases[i];

//       // 2. Call your existing execution logic (Internal or External)
//       // If /api/execute is an internal function, call that logic directly.
//       // Otherwise, you can fetch it:
//       const executionResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/execute`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           language,
//           code,
//           stdin: tc.input,
//         }),
//       });

//       const execData = await executionResponse.json();

//       // 3. Comparison Logic (The "Passed or Failed" check)
//       const actualOutput = (execData.stdout || "").trim();
//       const expectedOutput = (tc.output || "").trim();

//       if (actualOutput !== expectedOutput) {
//         finalStatus = "Wrong Answer";
//         errorMessage = `Failed at Case #${i + 1}. Expected: ${expectedOutput}, Got: ${actualOutput}`;
//         break; // Stop checking cases once one fails
//       }

//       // 4. Handle errors from the execution engine (TLE, Runtime Error)
//       if (execData.status === "error") {
//         finalStatus = "Runtime Error";
//         errorMessage = execData.stderr || "Execution failed.";
//         break;
//       }
//     }

//     // 5. Save the final result to the DB
//     const submission = await Submission.create({
//       problem: problem._id,
//       user: userId,
//       code,
//       language,
//       status: finalStatus, // This is what tracks if the problem is solved
//     });

//     return NextResponse.json({ 
//       success: true, 
//       status: finalStatus, 
//       message: errorMessage 
//     });

//   } catch (error: any) {
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }



// app/api/submissions/create/route.ts
import { connectDB } from "../../config/db";
import { NextResponse } from "next/server";
import Submission from "../../models/submission.models";
import problemModels from "../../models/problem.models";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { problemId, userId, code, language } = await req.json();

    if (!problemId || !userId || !code || !language) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
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

    // Run against every test case
    for (let i = 0; i < problem.testCases.length; i++) {
      const tc = problem.testCases[i];

      let execData: any;
      try {
        const execResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/execute`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              language,
              code,
              stdin: tc.input,
            }),
          }
        );
        execData = await execResponse.json();
      } catch (fetchErr: any) {
        finalStatus = "Runtime Error";
        errorMessage = "Execution engine unreachable.";
        failedIndex = i;
        break;
      }

      // Log for debugging
      console.log(`Test case ${i + 1} exec result:`, JSON.stringify(execData));

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
      { success: false, message: error.message },
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
