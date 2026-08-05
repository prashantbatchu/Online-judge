"use client";
import React, { useState } from 'react';
import Editor from '@monaco-editor/react';

export default function PlaygroundPage() {
  const [code, setCode] = useState(`// JavaScript Playground\n\nfunction main() {\n  console.log("Hello, Big_OJ!");\n}\n\nmain();`);
  const [userInput, setUserInput] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [selectedLang, setSelectedLang] = useState("javascript");

  const CODE_SNIPPETS = {
    javascript: `// JavaScript Playground\n\nfunction main() {\n  console.log("Hello, Big_OJ!");\n}\n\nmain();`,
    python: `# Python Playground\n\ndef main():\n    print("Hello, Big_OJ!")\n\nif __name__ == "__main__":\n    main()`,
    cpp: `// C++ Playground\n#include <bits/stdc++.h>\n\nint main() {\n    std::cout << "Hello, Big_OJ!" << std::endl;\n    return 0;\n}`,
    java: `// Java Playground\n// Note: Class name must be 'Main'\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Big_OJ!");\n    }\n}`,
   };
  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput("");
    
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: selectedLang,
          code: code,
          stdin: userInput,
        }),
      });

      if (res.status === 401) {
        setOutput("Please log in to run code in the playground.");
        return;
      }
      if (res.status === 429) {
        setOutput("You're running code too frequently — please wait a moment and try again.");
        return;
      }

      const data = await res.json();

      if (data.status === "success") {
        // 1. Identify which output exists (Prioritize stdout, then stderr, then exception)
        const resultText = data.stdout || data.stderr || data.exception || "Execution finished with no output.";
        
        // 2. Construct the final string with metadata (Time and Memory)
        const formattedOutput = `Output:\n\n${resultText}\n\n---
        Execution time : ${data.executionTime} ms
        Memory used    : ${data.memoryUsed} bytes`;

        setOutput(formattedOutput);
        
        } else {
        // This block handles API-level failures or compilation errors reported by the status
        setOutput(`Error: ${data.stderr || "Could not execute code."}`);
        }
    } catch (err) {
      setOutput("System Error: Failed to connect to the execution engine.");
    } finally {
      setIsRunning(false);
    }
  };
  const onSelectChange = (newLang: string) => {
      setSelectedLang(newLang);
      // This automatically sets the editor content to the correct snippet
      setCode(CODE_SNIPPETS[newLang as keyof typeof CODE_SNIPPETS]);
  };
  const handleSaveFile = () => {
    // 1. Determine extension based on selectedLang
    const extensions: Record<string, string> = {
      javascript: 'js',
      python: 'py',
      cpp: 'cpp',
      java: 'java'
    };
    const ext = extensions[selectedLang] || 'txt';

    // 2. Create a blob and a temporary download link
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `solution.${ext}`; // e.g., solution.cpp
    link.click();

    // 3. Clean up
    URL.revokeObjectURL(url);
  };

    
  return (
    <div className="flex flex-col h-[calc(100vh-30px)] bg-[#050505] text-zinc-300 w-[85%] mx-auto py-4 animate-in fade-in duration-700">
      
      {/* 1. HEADER / SETTINGS BAR */}
      <div className="h-16 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-between px-8 backdrop-blur-xl mb-4">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-sm font-black uppercase tracking-[0.3em] text-white">Code Playground</h1>
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Scratchpad v1.0</span>
          </div>
          <div className="h-6 w-[1px] bg-zinc-800 ml-2"></div>
          
                    
            <select 
                value={selectedLang}
                onChange={(e) => onSelectChange(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase text-blue-400 outline-none border border-zinc-800 rounded-lg px-3 py-1.5"
                >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
            </select>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleSaveFile} className="p-2.5 bg-zinc-800/50 hover:bg-zinc-700 rounded-xl transition-all border border-zinc-700 group">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 group-hover:text-white"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><path d="M7 3v5h8"/></svg>  
          </button>
          <button 
            onClick={handleRunCode}
            disabled={isRunning}
            className={`flex items-center gap-3 px-8 h-11 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95 ${
              isRunning ? 'bg-zinc-800 text-zinc-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)]'
            }`}
          >
            {isRunning ? "Executing..." : "Run Code"}
            {!isRunning && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        
        {/* LEFT: EDITOR SECTION (Expanded) */}
        <div className="flex-grow bg-zinc-900/20 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col backdrop-blur-sm">
          <div className="h-10 bg-zinc-900/40 border-b border-zinc-800 flex items-center px-8">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Untitled_Snippet</span>
          </div>
          <div className="flex-1">
            <Editor
                height="100%"
                // 1. Change defaultLanguage to language
                language={selectedLang} 
                // 2. Add a key to force the editor to refresh workers (optional but recommended for C++/Java)
                key={selectedLang} 
                theme="vs-dark"
                value={code}
                onChange={(v) => setCode(v || "")}
                options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    padding: { top: 10 },
                    fontFamily: 'JetBrains Mono, monospace',
                    lineHeight: 22,
                    cursorBlinking: "expand",
                    smoothScrolling: true,
                    renderLineHighlight: "all",
                    // 3. Ensure these are enabled for C++ suggestions
                    quickSuggestions: true,
                    suggestOnTriggerCharacters: true,
                }}
                />
          </div>
        </div>

        {/* RIGHT: INPUT/OUTPUT PANELS */}
        <div className="w-[400px] flex flex-col gap-4">
          
          {/* CUSTOM INPUT */}
          <div className="h-1/2 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
            <div className="h-10 bg-zinc-900/60 border-b border-zinc-800 px-6 flex items-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Custom Input</span>
            </div>
            <textarea 
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1 bg-transparent p-6 outline-none text-xs font-mono text-zinc-300 resize-none placeholder:text-zinc-700"
              placeholder="Enter your input data here..."
            />
          </div>

          {/* RESULTS OUTPUT */}
          <div className="h-1/2 bg-black border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-inner">
            <div className="h-10 bg-zinc-900/60 border-b border-zinc-800 px-6 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Output</span>
              {output && (
                <button onClick={() => setOutput("")} className="text-[9px] font-bold text-zinc-600 hover:text-white uppercase transition-colors">Clear</button>
              )}
            </div>
            <div className="flex-1 p-6 font-mono text-xs overflow-y-auto whitespace-pre-wrap">
              {isRunning ? (
                <div className="flex flex-col gap-2 animate-pulse">
                   <div className="h-2 w-3/4 bg-zinc-800 rounded"></div>
                   <div className="h-2 w-1/2 bg-zinc-800 rounded"></div>
                </div>
              ) : (
                <span className={output ? "text-green-500" : "text-zinc-700"}>
                  {output || "Run code to see the results..."}
                </span>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}



