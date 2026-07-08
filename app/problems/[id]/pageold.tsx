
// "use client";
// import React, { useEffect, useState, use } from 'react';
// import Editor from '@monaco-editor/react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';

// export default function ProblemSolvingPage({ params }: { params: Promise<{ id: string }> }) {
//   const { id } = use(params);
//   const router = useRouter();
//   const CODE_SNIPPETS = {
//     javascript: `// JavaScript \n\nfunction main() {\n  console.log("Hello, Big_OJ!");\n}\n\nmain();`,
//     python: `# Python \n\ndef main():\n    print("Hello, Big_OJ!")\n\nif __name__ == "__main__":\n    main()`,
//     cpp: `// C++ \n#include <bits/stdc++.h>\n\nint main() {\n    std::cout << "Hello, Big_OJ!" << std::endl;\n    return 0;\n}`,
//     java: `// Java \n// Note: Class name must be 'Main'\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Big_OJ!");\n    }\n}`,
//    };
//   // --- STATE ---
//   const [problem, setProblem] = useState<any>(null);
//   const [code, setCode] = useState(CODE_SNIPPETS.javascript);
//   const [language, setLanguage] = useState("javascript");
//   const [activeTab, setActiveTab] = useState("description");
//   const [isConsoleOpen, setIsConsoleOpen] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [executionResult, setExecutionResult] = useState<any>(null);

//   const [selectedLang, setSelectedLang] = useState("javascript");



//    const onSelectChange = (newLang: string) => {
//       setSelectedLang(newLang);
//       setLanguage(newLang);
//       // This automatically sets the editor content to the correct snippet
//       setCode(CODE_SNIPPETS[newLang as keyof typeof CODE_SNIPPETS]);
//   };
//   // --- 1. FETCH PROBLEM DATA ---
//   useEffect(() => {
//     const fetchProblem = async () => {
//       const res = await fetch(`/api/problems/${id}`);
//       const data = await res.json();
//       if (data.success) {
//         setProblem(data.problem);
//         // Set default starter code based on title/slug
//         setCode(CODE_SNIPPETS.javascript);
//       }
//     };
//     fetchProblem();
//   }, [id]);

//   // --- 2. SUBMISSION LOGIC ---
//   const handlePushSolution = async () => {
//     setIsSubmitting(true);
//     setIsConsoleOpen(true);
//     setExecutionResult({ status: "Processing", message: "Initialising Virtual Machine..." });

//     try {
//       const user = JSON.parse(localStorage.getItem('user') || '{}');
      
//       const res = await fetch('/api/submissions/create', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           problemId: problem._id, 
//           userId: user._id,
//           code,
//           language
//         }),
//       });

//       const data = await res.json();
//       setExecutionResult(data); // This will contain status: "Accepted", "WA", etc.
//     } catch (error) {
//       setExecutionResult({ status: "Error", message: "Network failure. System offline." });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };


//   const [output, setOutput] = useState("");
//   const [isRunning, setIsRunning] = useState(false);

//   const [testResults, setTestResults] = useState<any[]>([]);

//   const handleRunCode = async () => {
//     if (!problem.testCases || problem.testCases.length === 0) return;

//     setIsRunning(true);
//     setTestResults([]); // Reset UI

//     // We only care about the first 2 cases for "Run"
//     const casesToTest = problem.testCases.slice(0, 2);

//     try {
//       const promises = casesToTest.map(async (tc: any, index: number) => {
//         const res = await fetch("/api/execute", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             language: selectedLang,
//             code: code,
//             stdin: tc.input, // Sending one specific input
//           }),
//         });

//         const data = await res.json();

//         // Normalize the output for comparison (trimming whitespace is vital)
//         const actualOutput = (data.stdout || "").trim();
//         const expectedOutput = (tc.output || "").trim();
//         const passed = actualOutput === expectedOutput;

//         return {
//           id: index + 1,
//           passed,
//           input: tc.input,
//           expected: expectedOutput,
//           actual: actualOutput,
//           error: data.stderr || data.exception,
//           metrics: { time: data.executionTime, memory: data.memoryUsed }
//         };
//       });

//       const finalResults = await Promise.all(promises);
//       setTestResults(finalResults);
      
//     } catch (err) {
//       setExecutionResult({ status: "Error", message: "Execution Engine Timeout" });
//     } finally {
//       setIsRunning(false);
//     }
//   };



//   const [submissions, setSubmissions] = useState<any[]>([]);
//   const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

//   const fetchSubmissions = async () => {
//     // 1. Get user safely
//     const user = JSON.parse(localStorage.getItem('user') || '{}');
    
//     // 2. Ensure both IDs exist before fetching
//     if (!user._id || !problem?._id) return;

//     setIsLoadingSubmissions(true);
//     try {
//       const res = await fetch(`/api/submissions/${problem._id}?userId=${user._id}`);
//       const data = await res.json();
//       if (data.success) {
//         setSubmissions(data.submissions);
//       }
//     } catch (error) {
//       console.error("Failed to fetch submissions:", error);
//     } finally {
//       setIsLoadingSubmissions(false);
//     }
//   };

//   // Trigger fetch when tab changes OR when the problem data finally loads
//   useEffect(() => {
//     if (activeTab === "submissions") {
//       fetchSubmissions();
//     }
//   }, [activeTab, problem?._id]); // Added problem?._id here


//   if (!problem) return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-mono tracking-widest uppercase animate-pulse">Loading_Module_{id}...</div>;

//   return (
//     <div className="flex flex-col min-h-screen bg-[#050505] text-zinc-300 w-[85%] mx-auto py-8 custom-scrollbar">
      
//       {/* 1. TOP TOOLBAR */}
//       <div className=" top-0 z-50 h-16 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center justify-between px-8 backdrop-blur-2xl mb-8 shadow-2xl">
//         <div className="flex items-center gap-8">
//           <Link href="/problems" className="group flex items-center gap-3 text-zinc-500 hover:text-white transition-all">
//             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
//             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Exit Portal</span>
//           </Link>
//           <div className="h-8 w-[1px] bg-zinc-800"></div>
//           <div className="flex flex-col">
//             <span className="text-sm font-bold text-white tracking-tight">{problem.title}</span>
//             <div className="flex gap-2 items-center">
//                 <span className={`text-[9px] font-black uppercase tracking-widest ${problem.difficulty === 'Easy' ? 'text-green-500' : problem.difficulty === 'Medium' ? 'text-yellow-500' : 'text-red-500'}`}>
//                   {problem.difficulty}
//                 </span>
//                 <span className="text-[9px] text-zinc-600 font-bold tracking-widest">• {problem.tags?.join(', ')}</span>
//             </div>
//           </div>
//         </div>
        
//         <div className="flex items-center gap-4">
//            <button className="h-10 px-4 flex items-center gap-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-xl transition-all border border-zinc-700 text-[10px] font-black uppercase tracking-widest">
//               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
//               Retrieve History
//            </button>
//         </div>
//       </div>

//       {/* 2. DESCRIPTION & EDITOR GRID */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 ">
        
//         {/* LEFT COLUMN: DESCRIPTION */}
//         <section className="bg-zinc-900/20 border border-zinc-800 rounded-[2.5rem] overflow-hidden flex flex-col backdrop-blur-sm h-[800px]">
//           <div className="flex bg-zinc-900/40 border-b border-zinc-800 px-8 py-4 gap-10">
//              {["Description", "Submissions", "Discussion"].map((tab) => (
//                 <button 
//                   key={tab}
//                   onClick={() => setActiveTab(tab.toLowerCase())}
//                   className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all relative pb-1 ${
//                       activeTab === tab.toLowerCase() ? "text-blue-500" : "text-zinc-600 hover:text-zinc-400"
//                   }`}
//                 >
//                   {tab}
//                   {activeTab === tab.toLowerCase() && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 rounded-full"></span>}
//                 </button>
//              ))}
//           </div>
          
//           <div className="flex-1 p-10 overflow-y-auto custom-scrollbar font-sans ">
//              {activeTab === "description" && (
//                <div className="max-w-3xl">
//                  <h2 className="text-2xl font-bold text-white mb-6">{problem.title}</h2>
//                  <div className="text-zinc-400 leading-relaxed text-sm whitespace-pre-wrap mb-10">
//                     {problem.description}
//                  </div>
                 
//                  {/* Test Case Preview */}
//                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 mb-4">Sample Test Cases</h4>
//                   <div className="grid grid-cols-1 gap-4">
//                     {problem.testCases?.slice(0, 2).map((tc: any, index: number) => (
//                       <div key={index} className="bg-black/40 border border-zinc-800 rounded-2xl p-4 font-mono text-xs">
//                         <p className="text-blue-500 mb-2 font-black uppercase text-[9px]">Case #{index + 1}</p>
//                         <div className="space-y-1">
//                           <p><span className="text-zinc-600">Input:</span> {tc.input}</p>
//                           <p><span className="text-zinc-600">Output:</span> {tc.output}</p>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                </div>
//              )}
//              {activeTab === "submissions" && (
//                 <div className="p-4">
//                   {isLoadingSubmissions ? (
//                     <div className="animate-pulse text-zinc-500 font-mono text-[10px]">
//                       SCANNING_ARCHIVES...
//                     </div>
//                   ) : (
//                     <div className="flex flex-col gap-3">
//                       {submissions.map((sub) => (
//                         <div key={sub._id} className="bg-black/40 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
//                           <div>
//                             <span className={`text-[10px] font-black uppercase tracking-widest ${
//                               sub.status === 'Accepted' ? 'text-green-500' : 'text-red-500'
//                             }`}>
//                               {sub.status}
//                             </span>
//                             <p className="text-zinc-500 text-[9px] mt-1 uppercase">
//                               {new Date(sub.createdAt).toLocaleString()} • {sub.language}
//                             </p>
//                           </div>
//                           <button className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white border border-zinc-800 px-3 py-1 rounded-lg">
//                             View Code
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               )}


//              <div className="font-mono text-xs space-y-4">
//                   {isRunning ? (
//                     <p className="text-blue-400 animate-pulse">{">"} Testing sample cases...</p>
//                   ) : (
//                     testResults.map((res) => (
//                       <div key={res.id} className="border-zinc-800 pl-4 py-4">
//                         <div className="flex items-center gap-3 mb-2">
//                           {res.passed ? (
//                             <span className="text-green-500 font-bold tracking-tighter uppercase">✓ Case #{res.id} Passed</span>
//                           ) : (
//                             <span className="text-red-500 font-bold tracking-tighter uppercase">✕ Case #{res.id} Failed</span>
//                           )}
//                           <span className="text-[10px] text-zinc-600">Input: {res.input}</span>
//                         </div>

//                         {!res.passed && (
//                           <div className="bg-black/40 p-3 rounded-lg border border-zinc-800 space-y-1 mt-2">
//                             <p className="text-zinc-500 text-[10px]">Expected: <span className="text-green-400">{res.expected}</span></p>
//                             <p className="text-zinc-500 text-[10px]">Actual: <span className="text-red-400">{res.actual || "null"}</span></p>
//                             {res.error && <p className="text-red-800 text-[9px] mt-2 italic">{res.error}</p>}
//                           </div>
//                         )}
//                       </div>
//                     ))
//                   )}
//                 </div>
//           </div>
          
//         </section>
        
//         {/* RIGHT COLUMN: EDITOR */}
//         <section className="flex flex-col bg-zinc-900/20 border border-zinc-800 rounded-[2.5rem] overflow-hidden h-[800px] relative">
//           <div className="h-16 bg-zinc-900/40 border-b border-zinc-800 flex items-center justify-between px-8">
//             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Source_Code://main</span>
//             <select 
//               value={selectedLang}
//                 onChange={(e) => onSelectChange(e.target.value)}
//               className="bg-zinc-800 border border-zinc-700 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg text-blue-400 outline-none"
//             >
//                 <option value="javascript">JavaScript</option>
//                 <option value="python">Python</option>
//                 <option value="cpp">C++</option>
//                 <option value="java">Java</option>
//             </select>
//           </div>
             
//           <div className="flex-1 relative bg-black/20">
//             <Editor
//                 height="100%"
//                 // 1. Change defaultLanguage to language
//                 language={selectedLang} 
//                 // 2. Add a key to force the editor to refresh workers (optional but recommended for C++/Java)
//                 key={selectedLang} 
//                 theme="vs-dark"
//                 value={code}
//                 onChange={(v) => setCode(v || "")}
//                 options={{
//                     fontSize: 14,
//                     minimap: { enabled: false },
//                     padding: { top: 10 },
//                     fontFamily: 'JetBrains Mono, monospace',
//                     lineHeight: 22,
//                     cursorBlinking: "expand",
//                     smoothScrolling: true,
//                     renderLineHighlight: "all",
//                     // 3. Ensure these are enabled for C++ suggestions
//                     quickSuggestions: true,
//                     suggestOnTriggerCharacters: true,
//                 }}
//                 />
            
//             {/* TERMINAL OVERLAY */}
//             {isConsoleOpen && (
//               <div className="absolute bottom-0 left-0 right-0 h-64 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-3xl p-8 z-10">
//                  <div className="flex items-center justify-between mb-4">
//                     <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">System Output</span>
//                     <button onClick={() => setIsConsoleOpen(false)} className="text-zinc-600 hover:text-white">✕</button>
//                  </div>
//                  <div className="font-mono text-xs space-y-2">
//                     {isSubmitting ? (
//                       <p className="text-blue-400 animate-pulse">{">"} Compiling and executing against test suite...</p>
//                     ) : (
//                       <>
//                         <p className={executionResult?.status === "Accepted" ? "text-green-500" : "text-red-500"}>
//                           {">"} Status: {executionResult?.status}
//                         </p>
//                         <p className="text-zinc-400">{executionResult?.message}</p>
//                       </>
//                     )}
//                  </div>
//               </div>
//             )}
//           </div>
//           {/* Inside your TERMINAL OVERLAY */}


//           {/* 4. FOOTER ACTION BAR */}
//             <div className="h-20 bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between px-8">
//               <button 
//                 onClick={() => setIsConsoleOpen(!isConsoleOpen)} 
//                 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all"
//               >
//                 {isConsoleOpen ? "Hide Terminal" : "Show Terminal"}
//               </button>
              
//               <div className="flex gap-4">
//                 {/* RUN BUTTON: For testing only */}
//                 <button 
//                   onClick={handleRunCode} // You can create a separate handleRun if you want different logic

//                   className="h-11 px-6 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 border border-zinc-800 hover:border-zinc-600 rounded-xl transition-all"
//                 >
//                   Run Code
//                 </button>

//                 {/* SUBMIT BUTTON: The "Push Solution" */}
//                 <button 
//                   onClick={handlePushSolution}
//                   disabled={isSubmitting}
//                   className={`h-11 px-8 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl transition-all shadow-lg ${
//                     isSubmitting 
//                       ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
//                       : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
//                   }`}
//                 >
//                   {isSubmitting ? "Judging..." : "Push Solution"}
//                 </button>
//               </div>
//             </div>
//         </section>
//       </div>
//     </div>
//   );
// }


"use client";
import React, { useEffect, useState, use, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface TestCase { input: string; output: string; }
interface Problem {
  _id: string; title: string; description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard'; tags: string[]; testCases: TestCase[];
}
interface TestResult {
  id: number; passed: boolean; input: string;
  expected: string; actual: string; error?: string;
  metrics?: { time?: number; memory?: number };
}
interface Submission {
  _id: string; status: string; language: string;
  createdAt: string; code?: string;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CODE_SNIPPETS: Record<string, string> = {
  javascript: `// JavaScript\n\nfunction main() {\n  console.log("Hello, Big_OJ!");\n}\n\nmain();`,
  python: `# Python\n\ndef main():\n    print("Hello, Big_OJ!")\n\nif __name__ == "__main__":\n    main()`,
  cpp: `// C++\n#include <bits/stdc++.h>\n\nint main() {\n    std::cout << "Hello, Big_OJ!" << std::endl;\n    return 0;\n}`,
  java: `// Java\n// Note: Class name must be 'Main'\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Big_OJ!");\n    }\n}`,
};

const DIFF_COLOR = { add: '#166534', remove: '#7f1d1d', neutral: '#1c1c1c' };

// ─── MARKDOWN RENDERER (lightweight, no deps) ─────────────────────────────────
function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="md-code"><code class="md-code-inner">$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="md-inline">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    .replace(/^\- (.+)$/gm, '<li class="md-li">$1</li>')
    .replace(/(<li[\s\S]*?<\/li>)/g, '<ul class="md-ul">$1</ul>')
    .replace(/\n\n/g, '</p><p class="md-p">')
    .replace(/^(?!<[hupli])/gm, '<p class="md-p">')
    .replace(/<p class="md-p"><\/p>/g, '');
}

// ─── TIMER COMPONENT ──────────────────────────────────────────────────────────
function ContestTimer({ active }: { active: boolean }) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active]);

  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');

  return (
    <span className={`font-mono text-xs tracking-widest tabular-nums transition-colors ${seconds > 0 ? 'text-orange-400' : 'text-zinc-600'}`}>
      {h}:{m}:{s}
    </span>
  );
}

// ─── CODE DIFF VIEWER ─────────────────────────────────────────────────────────
function CodeDiffViewer({ oldCode, newCode, onClose }: { oldCode: string; newCode: string; onClose: () => void }) {
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');
  const maxLen = Math.max(oldLines.length, newLines.length);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-5xl max-h-[80vh] bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Code Diff Viewer</span>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-lg">✕</button>
        </div>
        <div className="overflow-auto flex-1">
          <div className="grid grid-cols-2 divide-x divide-zinc-800">
            <div>
              <div className="px-4 py-2 bg-red-950/30 border-b border-zinc-800 text-[10px] font-black uppercase tracking-widest text-red-400">Previous</div>
              {Array.from({ length: maxLen }, (_, i) => (
                <div key={i} className={`px-4 py-0.5 font-mono text-[11px] flex gap-3 ${oldLines[i] !== newLines[i] ? 'bg-red-950/20 text-red-300' : 'text-zinc-500'}`}>
                  <span className="text-zinc-700 select-none w-6 text-right shrink-0">{i + 1}</span>
                  <span className="whitespace-pre">{oldLines[i] ?? ''}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="px-4 py-2 bg-green-950/30 border-b border-zinc-800 text-[10px] font-black uppercase tracking-widest text-green-400">Current</div>
              {Array.from({ length: maxLen }, (_, i) => (
                <div key={i} className={`px-4 py-0.5 font-mono text-[11px] flex gap-3 ${oldLines[i] !== newLines[i] ? 'bg-green-950/20 text-green-300' : 'text-zinc-500'}`}>
                  <span className="text-zinc-700 select-none w-6 text-right shrink-0">{i + 1}</span>
                  <span className="whitespace-pre">{newLines[i] ?? ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AI HINT PANEL ────────────────────────────────────────────────────────────
function AIHintPanel({ problem, code, language, onClose }: { problem: Problem; code: string; language: string; onClose: () => void }) {
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [hintLevel, setHintLevel] = useState<'nudge' | 'approach' | 'explain'>('nudge');

  const fetchHint = async (level: 'nudge' | 'approach' | 'explain') => {
    setHintLevel(level);
    setLoading(true);
    setHint('');
    try {
      const prompts = {
        nudge: `Problem: "${problem.title}"\nDescription: ${problem.description}\n\nGive a very short nudge (1-2 sentences) to help a student who is stuck. Don't reveal the solution. Just a directional hint.`,
        approach: `Problem: "${problem.title}"\nDescription: ${problem.description}\nStudent's current code (${language}):\n${code}\n\nExplain the recommended approach in 3-5 sentences. Mention data structures or algorithms to consider. Don't write the solution.`,
        explain: `Problem: "${problem.title}"\nDescription: ${problem.description}\nStudent's current code (${language}):\n${code}\n\nAnalyze their code. Point out what's correct, what's wrong or missing, and give a clear explanation of what to fix. Be educational and constructive.`,
      };
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompts[level] }],
        }),
      });
      const data = await res.json();
      setHint(data.content?.[0]?.text || 'Could not generate hint.');
    } catch {
      setHint('Failed to connect to AI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHint('nudge'); }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-zinc-950 border border-blue-500/30 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-blue-950/20">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 text-sm">✦</span>
            <span className="text-xs font-black uppercase tracking-widest text-zinc-300">AI Hint Engine</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
        </div>

        <div className="flex gap-2 px-6 py-3 border-b border-zinc-800">
          {(['nudge', 'approach', 'explain'] as const).map(level => (
            <button
              key={level}
              onClick={() => fetchHint(level)}
              className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${hintLevel === level ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}
            >
              {level === 'nudge' ? '💡 Nudge' : level === 'approach' ? '🗺 Approach' : '🔍 Explain My Code'}
            </button>
          ))}
        </div>

        <div className="p-6 min-h-[180px]">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-3 bg-zinc-800 rounded animate-pulse`} style={{ width: `${90 - i * 15}%` }} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-300 leading-relaxed">{hint}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ProblemSolvingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // ── Theme ──
  const [isDark, setIsDark] = useState(true);

  // ── Problem & Editor ──
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState(CODE_SNIPPETS.javascript);
  const [language, setLanguage] = useState('javascript');
  const [activeTab, setActiveTab] = useState('description');

  // ── Execution ──
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  // ── Submissions ──
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [diffSub, setDiffSub] = useState<{ old: string; current: string } | null>(null);

  // ── Features ──
  const [timerActive, setTimerActive] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [savedCode, setSavedCode] = useState<string | null>(null); // for diff

  // ── Keyboard shortcut: Ctrl+Enter to run ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (problem) handleRunCode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setSavedCode(code);
        // flash save indicator
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [code, problem]);

  // ── Fetch problem ──
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await fetch(`/api/problems/${id}`);
        const data = await res.json();
        if (data.success) setProblem(data.problem);
      } catch (err) {
        console.error('Failed to fetch problem', err);
      }
    };
    fetchProblem();
  }, [id]);

  // ── Fetch submissions when tab changes ──
  const fetchSubmissions = useCallback(async () => {
    if (!problem?._id) return;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user._id) return;
    setIsLoadingSubmissions(true);
    try {
      const res = await fetch(`/api/submissions/${problem._id}?userId=${user._id}`);
      const data = await res.json();
      if (data.success) setSubmissions(data.submissions);
    } catch (err) {
      console.error('Submissions fetch failed', err);
    } finally {
      setIsLoadingSubmissions(false);
    }
  }, [problem?._id]);

  useEffect(() => {
    if (activeTab === 'submissions') fetchSubmissions();
  }, [activeTab, fetchSubmissions]);

  // ── Language change ──
  const onSelectChange = (lang: string) => {
    setLanguage(lang);
    setCode(CODE_SNIPPETS[lang] ?? '');
  };

  // ── Run code (first 2 test cases) ──
  const handleRunCode = async () => {
    if (!problem?.testCases?.length) return;
    setIsRunning(true);
    setTestResults([]);
    setIsConsoleOpen(true);

    const casesToTest = problem.testCases.slice(0, 2);
    try {
      const promises = casesToTest.map(async (tc, index) => {
        const res = await fetch('/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language, code, stdin: tc.input }),
        });
        const data = await res.json();
        const actual = (data.stdout || '').trim();
        const expected = (tc.output || '').trim();
        return {
          id: index + 1,
          passed: actual === expected,
          input: tc.input,
          expected,
          actual,
          error: data.stderr || data.exception,
          metrics: { time: data.executionTime, memory: data.memoryUsed },
        };
      });
      const results = await Promise.all(promises);
      setTestResults(results);
    } catch {
      setExecutionResult({ status: 'Error', message: 'Execution Engine Timeout' });
    } finally {
      setIsRunning(false);
    }
  };

  // ── Submit solution ──
  const handlePushSolution = async () => {
    setIsSubmitting(true);
    setIsConsoleOpen(true);
    setExecutionResult({ status: 'Processing', message: 'Initialising Virtual Machine...' });
    setSavedCode(code); // save for diff

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch('/api/submissions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: problem!._id, userId: user._id, code, language }),
      });
      const data = await res.json();
      setExecutionResult(data);
    } catch {
      setExecutionResult({ status: 'Error', message: 'Network failure. System offline.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Difficulty color ──
  const diffColor = (d?: string) =>
    d === 'Easy' ? 'text-emerald-400' : d === 'Medium' ? 'text-amber-400' : 'text-rose-400';

  const theme = isDark ? 'vs-dark' : 'light';
  const bg = isDark ? 'bg-[#050505]' : 'bg-zinc-100';
  const panel = isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-zinc-200';
  const text = isDark ? 'text-zinc-300' : 'text-zinc-800';
  const subtext = isDark ? 'text-zinc-500' : 'text-zinc-500';
  const tabBg = isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200';

  if (!problem) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-mono tracking-widest uppercase animate-pulse">
      Loading_Module_{id}...
    </div>
  );

  return (
    <>
      {/* ── GLOBAL STYLES ── */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 99px; }
        .md-h1 { font-size: 1.4rem; font-weight: 800; color: ${isDark ? '#fff' : '#111'}; margin: 1rem 0 .5rem; }
        .md-h2 { font-size: 1.1rem; font-weight: 700; color: ${isDark ? '#e4e4e7' : '#222'}; margin: .8rem 0 .4rem; }
        .md-h3 { font-size: .95rem; font-weight: 700; color: ${isDark ? '#a1a1aa' : '#444'}; margin: .6rem 0 .3rem; }
        .md-p  { color: ${isDark ? '#a1a1aa' : '#555'}; line-height: 1.7; margin: .4rem 0; font-size: .875rem; }
        .md-code { background: ${isDark ? '#111' : '#f4f4f5'}; border: 1px solid ${isDark ? '#27272a' : '#e4e4e7'}; border-radius: .75rem; padding: .75rem 1rem; margin: .5rem 0; overflow-x: auto; }
        .md-code-inner { font-family: 'JetBrains Mono', monospace; font-size: .75rem; color: ${isDark ? '#93c5fd' : '#2563eb'}; }
        .md-inline { background: ${isDark ? '#18181b' : '#f4f4f5'}; color: ${isDark ? '#f97316' : '#ea580c'}; padding: 0 .3rem; border-radius: .25rem; font-family: monospace; font-size: .85em; }
        .md-ul { list-style: none; margin: .5rem 0; }
        .md-li { color: ${isDark ? '#a1a1aa' : '#555'}; font-size: .875rem; padding: .2rem 0 .2rem 1.2rem; position: relative; }
        .md-li::before { content: '›'; position: absolute; left: 0; color: #3b82f6; }
        .result-enter { animation: slideUp .25s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .tab-active::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: #3b82f6; border-radius: 99px; }
        select option { background: #18181b; }
      `}</style>

      <div className={`flex flex-col min-h-screen ${bg} ${text} w-[88%] mx-auto py-6 custom-scrollbar transition-colors duration-300`}>

        {/* ── TOOLBAR ── */}
        <header className={`h-14 border ${panel} rounded-2xl flex items-center justify-between px-6 backdrop-blur-2xl mb-6 shadow-2xl`}>
          <div className="flex items-center gap-6">
            <Link href="/problems" className={`group flex items-center gap-2 ${subtext} hover:text-white transition-all`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Problems</span>
            </Link>
            <div className={`h-6 w-px ${isDark ? 'bg-zinc-800' : 'bg-zinc-300'}`}/>
            <div>
              <p className="text-sm font-bold tracking-tight">{problem.title}</p>
              <div className="flex gap-2 items-center">
                <span className={`text-[9px] font-black uppercase tracking-widest ${diffColor(problem.difficulty)}`}>{problem.difficulty}</span>
                <span className={`text-[9px] font-bold tracking-widest ${subtext}`}>• {problem.tags?.join(', ')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <button onClick={() => setTimerActive(t => !t)} className={`text-[9px] font-black uppercase tracking-widest transition-colors ${timerActive ? 'text-orange-400' : subtext}`}>
                {timerActive ? '⏸' : '▶'}
              </button>
              <ContestTimer active={timerActive} />
            </div>

            {/* Font size */}
            <div className="flex items-center gap-1">
              <button onClick={() => setFontSize(f => Math.max(10, f - 1))} className={`w-6 h-6 rounded-lg ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-200 hover:bg-zinc-300'} text-xs font-bold transition-colors`}>−</button>
              <span className={`text-[10px] font-mono w-6 text-center ${subtext}`}>{fontSize}</span>
              <button onClick={() => setFontSize(f => Math.min(22, f + 1))} className={`w-6 h-6 rounded-lg ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-200 hover:bg-zinc-300'} text-xs font-bold transition-colors`}>+</button>
            </div>

            {/* AI Hints */}
            <button
              onClick={() => setShowHints(true)}
              className="h-9 px-4 flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-400 transition-all"
            >
              ✦ AI Hint
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => setIsDark(d => !d)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl border ${isDark ? 'bg-zinc-800 border-zinc-700 text-yellow-400' : 'bg-zinc-100 border-zinc-300 text-zinc-600'} transition-all`}
              title="Toggle theme"
            >
              {isDark ? '☀' : '☽'}
            </button>
          </div>
        </header>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">

          {/* ── LEFT: DESCRIPTION PANEL ── */}
          <section className={`border ${panel} rounded-[2rem] overflow-hidden flex flex-col h-[820px]`}>
            {/* Tabs */}
            <nav className={`flex border-b ${tabBg} ${isDark ? 'border-zinc-800' : 'border-zinc-200'} px-6 py-0 gap-8`}>
              {['Description', 'Submissions', 'Discussion'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  // 1. Removed 'border-b' and 'tab-active' from the main string below
                  className={`relative text-[10px] font-black uppercase tracking-[0.3em] py-4 transition-all ${
                    activeTab === tab.toLowerCase() 
                      ? 'text-blue-500' // 2. Only active tab gets the blue text
                      : `${subtext} hover:${text}` // 3. Inactive tabs stay muted
                  }`}
                >
                  {tab}
                  
                  {/* 4. This absolute span is the ONLY "blue line". 
                      It only renders when the tab is active. */}
                  {activeTab === tab.toLowerCase() && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  )}
                </button>
              ))}
            </nav>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">

              {/* DESCRIPTION TAB */}
              {activeTab === 'description' && (
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`text-[9px] px-2 py-1 rounded-full font-black border ${
                      problem.difficulty === 'Easy' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
                      problem.difficulty === 'Medium' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
                      'border-rose-500/30 bg-rose-500/10 text-rose-400'
                    }`}>{problem.difficulty}</span>
                    {problem.tags?.map(tag => (
                      <span key={tag} className={`text-[9px] px-2 py-1 rounded-full font-black border ${isDark ? 'border-zinc-700 bg-zinc-800/50 text-zinc-400' : 'border-zinc-200 bg-zinc-100 text-zinc-500'}`}>{tag}</span>
                    ))}
                  </div>

                  {/* Markdown-rendered description */}
                  <div
                    className="mb-8 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(problem.description) }}
                  />

                  {/* Sample test cases */}
                  <p className={`text-[10px] uppercase tracking-[0.2em] font-black ${subtext} mb-4`}>Sample Cases</p>
                  <div className="space-y-3">
                    {problem.testCases?.slice(0, 2).map((tc, i) => (
                      <div key={i} className={`border rounded-2xl p-4 font-mono text-xs ${isDark ? 'bg-black/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                        <p className="text-blue-500 mb-2 font-black uppercase text-[9px]">Case #{i + 1}</p>
                        <p><span className={subtext}>Input: </span>{tc.input}</p>
                        <p><span className={subtext}>Output: </span>{tc.output}</p>
                      </div>
                    ))}
                  </div>

                  {/* Keyboard shortcuts hint */}
                  <div className={`mt-8 p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${subtext} mb-2`}>Shortcuts</p>
                    <div className="space-y-1">
                      {[['Ctrl + Enter', 'Run code'], ['Ctrl + S', 'Save snapshot for diff']].map(([key, desc]) => (
                        <div key={key} className="flex gap-3 items-center">
                          <code className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-600'}`}>{key}</code>
                          <span className={`text-[10px] ${subtext}`}>{desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SUBMISSIONS TAB */}
              {activeTab === 'submissions' && (
                <div>
                  {isLoadingSubmissions ? (
                    <div className={`font-mono text-[10px] animate-pulse ${subtext}`}>SCANNING_ARCHIVES...</div>
                  ) : submissions.length === 0 ? (
                    <div className={`py-16 flex flex-col items-center border-2 border-dashed ${isDark ? 'border-zinc-800' : 'border-zinc-300'} rounded-3xl`}>
                      <p className={`font-mono italic text-xs tracking-widest ${subtext}`}>NO SUBMISSIONS YET</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {submissions.map((sub, i) => (
                        <div key={sub._id} className={`border rounded-2xl p-4 flex items-center justify-between result-enter ${isDark ? 'bg-black/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border text-xs ${
                              sub.status === 'Accepted'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            }`}>
                              {sub.status === 'Accepted' ? '✓' : '✕'}
                            </div>
                            <div>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${sub.status === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {sub.status}
                              </span>
                              <p className={`text-[9px] mt-0.5 uppercase ${subtext}`}>
                                {new Date(sub.createdAt).toLocaleString()} • {sub.language}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {sub.code && savedCode && (
                              <button
                                onClick={() => setDiffSub({ old: sub.code!, current: code })}
                                className={`text-[9px] font-black uppercase tracking-widest border px-3 py-1 rounded-lg transition-all ${isDark ? 'border-zinc-800 text-zinc-400 hover:border-blue-500 hover:text-blue-400' : 'border-zinc-300 text-zinc-500 hover:border-blue-500 hover:text-blue-500'}`}
                              >
                                Diff
                              </button>
                            )}
                            <button
                              onClick={() => sub.code && setCode(sub.code)}
                              className={`text-[9px] font-black uppercase tracking-widest border px-3 py-1 rounded-lg transition-all ${isDark ? 'border-zinc-800 text-zinc-400 hover:text-white' : 'border-zinc-300 text-zinc-500 hover:text-zinc-800'}`}
                            >
                              Load
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* DISCUSSION TAB */}
              {activeTab === 'discussion' && (
                <div className={`py-16 flex flex-col items-center border-2 border-dashed ${isDark ? 'border-zinc-800' : 'border-zinc-300'} rounded-3xl`}>
                  <p className={`font-mono italic text-xs tracking-widest ${subtext}`}>DISCUSSION COMING SOON</p>
                </div>
              )}
            </div>
          </section>

          {/* ── RIGHT: EDITOR PANEL ── */}
          <section className={`flex flex-col border ${panel} rounded-[2rem] overflow-hidden h-[820px] relative`}>
            {/* Editor header */}
            <div className={`h-14 ${tabBg} border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'} flex items-center justify-between px-6`}>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${subtext}`}>Source_Code</span>
                {savedCode && (
                  <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest animate-pulse">● Snapshot saved</span>
                )}
              </div>
              <select
                value={language}
                onChange={e => onSelectChange(e.target.value)}
                className={`border text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg text-blue-400 outline-none transition-colors ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-100 border-zinc-300'}`}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>

            {/* Monaco Editor */}
            <div className={`flex-1 relative ${isDark ? 'bg-black/20' : 'bg-white'}`}>
              <Editor
                height="100%"
                language={language}
                key={language}
                theme={theme}
                value={code}
                onChange={v => setCode(v || '')}
                options={{
                  fontSize,
                  minimap: { enabled: false },
                  padding: { top: 12 },
                  fontFamily: 'JetBrains Mono, monospace',
                  lineHeight: 22,
                  cursorBlinking: 'expand',
                  smoothScrolling: true,
                  renderLineHighlight: 'all',
                  quickSuggestions: true,
                  suggestOnTriggerCharacters: true,
                  scrollBeyondLastLine: false,
                  overviewRulerLanes: 0,
                }}
              />

              {/* ── CONSOLE OVERLAY ── */}
              {isConsoleOpen && (
                <div className={`absolute bottom-0 left-0 right-0 border-t backdrop-blur-3xl z-10 transition-all ${isDark ? 'bg-zinc-950/96 border-zinc-800' : 'bg-white/96 border-zinc-200'}`}
                  style={{ height: testResults.length > 0 ? '280px' : '160px' }}>
                  <div className={`flex items-center justify-between px-6 py-3 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${subtext}`}>
                      {testResults.length > 0 ? 'Test Results' : 'System Output'}
                    </span>
                    <button onClick={() => setIsConsoleOpen(false)} className={`${subtext} hover:text-white text-sm`}>✕</button>
                  </div>

                  <div className="overflow-y-auto custom-scrollbar" style={{ height: 'calc(100% - 44px)' }}>
                    {/* Submission output */}
                    {!isRunning && testResults.length === 0 && (
                      <div className="px-6 py-4 font-mono text-xs space-y-2">
                        {isSubmitting ? (
                          <p className="text-blue-400 animate-pulse">{'>'} Compiling and executing against test suite...</p>
                        ) : (
                          <>
                            <p className={executionResult?.status === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'}>
                              {'>'} Status: {executionResult?.status}
                            </p>
                            {executionResult?.message && (
                              <p className={subtext}>{executionResult.message}</p>
                            )}
                            {executionResult?.runtime && (
                              <p className={subtext}>Runtime: {executionResult.runtime}ms</p>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Run results */}
                    {testResults.length > 0 && (
                      <div className="px-6 py-4 space-y-3">
                        {/* Summary bar */}
                        <div className="flex gap-3 mb-4">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${testResults.every(r => r.passed) ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {testResults.filter(r => r.passed).length}/{testResults.length} Passed
                          </span>
                          {testResults[0]?.metrics?.time && (
                            <span className={`text-[10px] font-mono ${subtext}`}>~{testResults[0].metrics.time}ms</span>
                          )}
                        </div>

                        {testResults.map(res => (
                          <div key={res.id} className={`rounded-xl border p-3 result-enter ${
                            res.passed
                              ? isDark ? 'bg-emerald-950/20 border-emerald-800/30' : 'bg-emerald-50 border-emerald-200'
                              : isDark ? 'bg-rose-950/20 border-rose-800/30' : 'bg-rose-50 border-rose-200'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-[10px] font-black uppercase ${res.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {res.passed ? '✓' : '✕'} Case #{res.id}
                              </span>
                              <span className={`text-[9px] font-mono ${subtext}`}>Input: {res.input}</span>
                            </div>
                            {!res.passed && (
                              <div className={`font-mono text-[10px] space-y-1 pt-2 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                                <p>Expected: <span className="text-emerald-400">{res.expected}</span></p>
                                <p>Got: <span className="text-rose-400">{res.actual || 'null'}</span></p>
                                {res.error && <p className="text-rose-600 text-[9px] italic mt-1">{res.error}</p>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {isRunning && (
                      <div className="px-6 py-4 font-mono text-xs">
                        <p className="text-blue-400 animate-pulse">{'>'} Running sample test cases...</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── ACTION BAR ── */}
            <div className={`h-16 ${tabBg} border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'} flex items-center justify-between px-6`}>
              <button
                onClick={() => setIsConsoleOpen(o => !o)}
                className={`text-[10px] font-black uppercase tracking-widest transition-all ${subtext} hover:${text}`}
              >
                {isConsoleOpen ? 'Hide Console' : 'Show Console'}
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className={`h-10 px-5 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl border transition-all ${
                    isRunning
                      ? `${isDark ? 'border-zinc-800 text-zinc-600' : 'border-zinc-300 text-zinc-400'} cursor-not-allowed`
                      : `${isDark ? 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white' : 'border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900'}`
                  }`}
                >
                  {isRunning ? 'Running...' : 'Run  ⌘↵'}
                </button>

                <button
                  onClick={handlePushSolution}
                  disabled={isSubmitting}
                  className={`h-10 px-7 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl transition-all shadow-lg ${
                    isSubmitting
                      ? `${isDark ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-200 text-zinc-400'} cursor-not-allowed`
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                  }`}
                >
                  {isSubmitting ? 'Judging...' : 'Push Solution'}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ── MODALS ── */}
      {showHints && (
        <AIHintPanel
          problem={problem}
          code={code}
          language={language}
          onClose={() => setShowHints(false)}
        />
      )}

      {diffSub && (
        <CodeDiffViewer
          oldCode={diffSub.old}
          newCode={diffSub.current}
          onClose={() => setDiffSub(null)}
        />
      )}
    </>
  );
}