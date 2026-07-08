// app/api/execute/route.ts
import { NextResponse } from "next/server";

const LANGUAGE_ID: Record<string, number> = {
  cpp:        54,
  c:          50,
  python:     71,
  java:       62,
  javascript: 63,
};

const b64 = (str: string) => Buffer.from(str).toString("base64");
const unb64 = (str: string | null) => str ? Buffer.from(str, "base64").toString("utf-8") : "";

export async function POST(req: Request) {
  try {
    const { language, code, stdin } = await req.json();

    const languageId = LANGUAGE_ID[language];
    if (!languageId) {
      return NextResponse.json({
        status: "error", stdout: "", stderr: `Unsupported language: ${language}`, exception: "",
      }, { status: 400 });
    }

    const response = await fetch(
      "https://ce.judge0.com/submissions?wait=true&base64_encoded=true",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language_id:  languageId,
          source_code:  b64(code),
          stdin:        b64(stdin || ""),
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Judge0 HTTP error:", response.status, errText);
      return NextResponse.json({
        status: "error", stdout: "", stderr: `Judge0 error ${response.status}: ${errText}`, exception: "",
      });
    }

    const data = await response.json();
    console.log("Judge0 response:", JSON.stringify(data, null, 2));

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
      status: "error", stdout: "", stderr: "Internal server error: " + error.message, exception: "",
    }, { status: 500 });
  }
}