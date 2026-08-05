"use client";
import React, { useEffect, useState, use } from "react";
import Editor from "@monaco-editor/react";
import Link from "next/link";

type TestCase = { input: string; output: string };
type Problem = {
  _id: string;
  number?: number;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  testCases: TestCase[];
};

type Submission = {
  _id: string;
  status: string;
  language: string;
  createdAt: string;
  executionTime?: number;
};

const SNIPPETS: Record<string, string> = {
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // your code here\n    return 0;\n}`,
  python: `import sys\ninput = sys.stdin.readline\n\ndef main():\n    pass\n\nif __name__ == "__main__":\n    main()`,
  javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').split('\\n');\n\nfunction main() {\n    // your code here\n}\n\nmain();`,
  java: `import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // your code here\n    }\n}`,
};

const difficultyStyle: Record<string, string> = {
  Easy: "text-green-400 border-green-500/30 bg-green-500/5",
  Medium: "text-yellow-400 border-yellow-500/30 bg-yellow-500/5",
  Hard: "text-red-400 border-red-500/30 bg-red-500/5",
};

export default function ProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [code, setCode] = useState(SNIPPETS["cpp"]);
  const [language, setLanguage] = useState("cpp");
  const [activeTab, setActiveTab] = useState<"description" | "submissions">(
    "description"
  );

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    status: string;
    message: string;
  } | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Custom test
  const [customInput, setCustomInput] = useState("");
  const [runOutput, setRunOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

  useEffect(() => {
    fetch(`/api/problems/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setProblem(data.problem);
          // Set first test case as default custom input
          if (data.problem.testCases?.[0]) {
            setCustomInput(data.problem.testCases[0].input);
          }
        } else {
          setNotFound(true);
        }
        setLoading(false);
      });
  }, [id]);

  const fetchSubmissions = () => {
    if (!problem || !user._id) return;
    setLoadingSubmissions(true);
    // userId is derived server-side from the session cookie now — no need
    // (and no ability) to pass someone else's id here.
    fetch(`/api/submissions/${problem._id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSubmissions(data.submissions);
        setLoadingSubmissions(false);
      });
  };

  useEffect(() => {
    if (activeTab === "submissions") fetchSubmissions();
  }, [activeTab, problem]);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCode(SNIPPETS[lang]);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setRunOutput("");
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, stdin: customInput }),
      });
      if (res.status === 401) {
        setRunOutput("Please log in to run code.");
        return;
      }
      const data = await res.json();
      const out =
        data.stdout || data.stderr || data.exception || "No output.";
      setRunOutput(out);
    } catch {
      setRunOutput("Error: Could not connect to execution engine.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!user._id) {
      setSubmitResult({
        status: "Error",
        message: "Please log in to submit.",
      });
      return;
    }
    setIsSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await fetch("/api/submissions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // No userId here — the server derives the submitter from the
        // session cookie, so there's nothing to spoof.
        body: JSON.stringify({
          problemId: problem!._id,
          code,
          language,
        }),
      });
      if (res.status === 401) {
        setSubmitResult({ status: "Error", message: "Your session expired — please log in again." });
        return;
      }
      const data = await res.json();
      setSubmitResult({ status: data.status, message: data.message });
      // Refresh submissions tab
      fetchSubmissions();
    } catch {
      setSubmitResult({
        status: "Error",
        message: "Network error. Try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-blue-500 font-mono animate-pulse text-xs uppercase tracking-widest">
          {">"} Loading problem...
        </p>
      </div>
    );

  if (notFound)
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400 font-mono text-lg">
          Problem {problem?.number ? `#${problem.number}` : ""} not found.
        </p>
        <Link href="/problems" className="text-blue-500 text-sm hover:underline">
          ← Back to Problem Set
        </Link>
      </div>
    );

  return (
    <div className="h-[calc(100vh-72px)] bg-black text-white flex overflow-hidden">
      {/* LEFT PANEL: Problem Description */}
      <div className="w-[45%] flex flex-col border-r border-zinc-800">
        {/* Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/30">
          {(["description", "submissions"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? "text-blue-400 border-b-2 border-blue-500"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === "description" && problem && (
            <div>
              {/* Title + Meta */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-zinc-500 font-mono text-sm">#{problem.number ?? "?"}</span>
                  <span
                    className={`text-[10px] px-2 py-1 rounded-lg border font-black uppercase tracking-widest ${
                      difficultyStyle[problem.difficulty]
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                </div>
                <h1 className="text-2xl font-black tracking-tight mb-4">
                  {problem.title}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {problem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] px-2 py-1 bg-zinc-800/60 text-zinc-400 rounded-md font-bold uppercase tracking-wider border border-zinc-700/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">
                  Problem Statement
                </h3>
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {problem.description}
                </p>
              </div>

              {/* Input / Output Format */}
              {problem.inputFormat && (
                <div className="mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                    Input Format
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
                    {problem.inputFormat}
                  </p>
                </div>
              )}
              {problem.outputFormat && (
                <div className="mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                    Output Format
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
                    {problem.outputFormat}
                  </p>
                </div>
              )}
              {problem.constraints && (
                <div className="mb-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                    Constraints
                  </h3>
                  <p className="text-zinc-400 text-sm font-mono leading-relaxed whitespace-pre-wrap">
                    {problem.constraints}
                  </p>
                </div>
              )}

              {/* Sample Test Cases (first 2 only) */}
              {problem.testCases.slice(0, 2).map((tc, i) => (
                <div
                  key={i}
                  className="mb-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden"
                >
                  <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      Example {i + 1}
                    </span>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">
                        Input
                      </p>
                      <pre className="text-xs text-zinc-300 font-mono bg-black/50 p-3 rounded-xl whitespace-pre-wrap">
                        {tc.input || "(empty)"}
                      </pre>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">
                        Output
                      </p>
                      <pre className="text-xs text-zinc-300 font-mono bg-black/50 p-3 rounded-xl whitespace-pre-wrap">
                        {tc.output}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "submissions" && (
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">
                Your Submissions
              </h3>
              {loadingSubmissions ? (
                <p className="text-zinc-600 font-mono text-xs animate-pulse">
                  Loading...
                </p>
              ) : submissions.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl">
                  <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest">
                    No submissions yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((s) => (
                    <div
                      key={s._id}
                      className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg border ${
                            s.status === "Accepted"
                              ? "text-green-400 border-green-500/20 bg-green-500/5"
                              : "text-red-400 border-red-500/20 bg-red-500/5"
                          }`}
                        >
                          {s.status}
                        </span>
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                          {s.language}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-600 font-mono">
                        {new Date(s.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Editor + Run/Submit */}
      <div className="flex-1 flex flex-col">
        {/* Editor Toolbar */}
        <div className="h-12 bg-zinc-900/40 border-b border-zinc-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase text-blue-400 outline-none border border-zinc-800 rounded-lg px-3 py-1.5"
            >
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="px-5 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-50"
            >
              {isRunning ? "Running..." : "Run"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
            >
              {isSubmitting ? "Judging..." : "Submit"}
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            language={language}
            key={language}
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v || "")}
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              padding: { top: 12 },
              fontFamily: "JetBrains Mono, monospace",
              lineHeight: 22,
              cursorBlinking: "expand",
              smoothScrolling: true,
              renderLineHighlight: "all",
            }}
          />
        </div>

        {/* Bottom: Custom Input + Output */}
        <div className="h-[220px] flex border-t border-zinc-800">
          {/* Custom Input */}
          <div className="w-1/2 flex flex-col border-r border-zinc-800">
            <div className="h-8 bg-zinc-900/60 border-b border-zinc-800 px-4 flex items-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                Custom Input
              </span>
            </div>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="flex-1 bg-transparent p-3 outline-none text-xs font-mono text-zinc-300 resize-none placeholder:text-zinc-700"
              placeholder="Enter test input..."
            />
          </div>

          {/* Output */}
          <div className="w-1/2 flex flex-col">
            <div className="h-8 bg-zinc-900/60 border-b border-zinc-800 px-4 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                Output
              </span>
              {/* Submission Result Badge */}
              {submitResult && (
                <span
                  className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                    submitResult.status === "Accepted"
                      ? "text-green-400 border-green-500/30 bg-green-500/5"
                      : "text-red-400 border-red-500/30 bg-red-500/5"
                  }`}
                >
                  {submitResult.status}
                </span>
              )}
            </div>
            <div className="flex-1 p-3 font-mono text-xs overflow-y-auto whitespace-pre-wrap">
              {isSubmitting ? (
                <p className="text-yellow-400 animate-pulse">
                  Running all test cases...
                </p>
              ) : submitResult ? (
                <div>
                  <p
                    className={
                      submitResult.status === "Accepted"
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {submitResult.status === "Accepted"
                      ? "✓ All test cases passed!"
                      : submitResult.message}
                  </p>
                </div>
              ) : isRunning ? (
                <p className="text-zinc-500 animate-pulse">Executing...</p>
              ) : runOutput ? (
                <span className="text-green-400">{runOutput}</span>
              ) : (
                <span className="text-zinc-700">
                  Run code or submit to see output...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
