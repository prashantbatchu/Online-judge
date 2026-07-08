// import Image from "next/image";

// export default function Home() {
//   return (
//     // <div>
//     //   <div className="w-[75%] mx-auto grid grid-cols-3 grid-rows-4 gap-4">
       
        
//     //   </div>
//     // </div>
//   );
// }
"use client"
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  // const [problems]
  const [problems,setProblems] =useState([]);
  
  useEffect(() => {
      fetch('/api/problems')
        .then(res => res.json())
        .then(data => {
          if (data.success) setProblems(data.problems);
        });
    }, []);

  
    const stats = {
      totalProblems: problems.length,
      topics: [
        { name: "Dynamic Programming", key: "DP", color: "text-blue-400" },
        { name: "Graphs", key: "Graphs", color: "text-purple-400" },
        { name: "Math", key: "Math", color: "text-green-400" },
        { name: "Greedy", key: "Greedy", color: "text-yellow-400" },
        { name: "Arrays", key: "Array", color: "text-red-400" },
        { name: "Strings", key: "Strings", color: "text-orange-400" },
      ].map(topic => {
        const count = problems.filter((p: any) => {
          if (!p || !p.tags) return false;

          // Normalize tags to lowercase and trim them
          const tagsArray = Array.isArray(p.tags) 
            ? p.tags.map(t => t.toLowerCase().trim()) 
            : p.tags.toLowerCase().split(',').map(t => t.trim());

          // Normalize the key to lowercase (e.g., "Strings" -> "string")
          // We also use .slice(0, -1) to match "Array" to "Arrays" if needed
          const searchKey = topic.key.toLowerCase().trim();

          return tagsArray.some(tag => 
            tag.includes(searchKey) || searchKey.includes(tag)
          );
        }).length;

        return { ...topic, count };
      })
    };
  return (
    <div className="flex flex-col min-h-screen font-sans text-white bg-black">
      {/* MAIN CONTENT WRAPPER */}
      <div className="w-[75%] mx-auto py-12 px-4 flex-grow">
        
        {/* 1. HERO SECTION */}
        <section className="mb-12">
          <h1 className="text-5xl font-bold mb-6 tracking-tight">
            Welcome to <span className="text-blue-500">Big_OJ</span>
          </h1>
          <p className="text-zinc-400 text-xl max-w-2xl leading-relaxed">
            The ultimate platform for competitive programming. Solve problems, 
            track your progress, and compete in world-class contests.
          </p>
        </section>

        {/* 2. STATS & TOPICS SECTION (NEW) */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {/* Total Problems Card */}
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col justify-center">
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Total Problems Uploaded</p>
            <p className="text-4xl font-bold text-white">{stats.totalProblems}</p>
          </div>
          
          {/* Topic Breakdown */}
          <div className="md:col-span-3 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Topic Breakdown</p>
            <div className="flex flex-wrap gap-6">
              {stats.topics.map((topic) => (
                <div key={topic.name} className="flex flex-col">
                  <span className={`font-bold text-lg ${topic.color}`}>{topic.count}</span>
                  <span className="text-zinc-500 text-xs">{topic.name}</span>
                </div>
              ))}
              <div className="flex flex-col">
                <span className="font-bold text-lg text-zinc-300">. . .</span>
                <span className="text-zinc-500 text-xs">Others</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* 3. PRIMARY NAVIGATION CARDS */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/problems" className="group relative p-8 bg-zinc-900 border border-zinc-800 rounded-3xl hover:border-blue-500/50 hover:bg-zinc-800/50 transition-all duration-300">
              <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform font-bold text-2xl">P</div>
              <h2 className="text-2xl font-bold mb-3">Problem Set</h2>
              <p className="text-zinc-500 leading-relaxed text-sm">Explore our library of challenges ranging from basic math to advanced dynamic programming.</p>
              <div className="mt-6 text-blue-500 font-bold text-sm inline-flex items-center gap-2">Browse Problems <span>→</span></div>
            </Link>

            <Link href="/contests" className="group relative p-8 bg-zinc-900 border border-zinc-800 rounded-3xl hover:border-purple-500/50 hover:bg-zinc-800/50 transition-all duration-300">
              <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform font-bold text-2xl">C</div>
              <h2 className="text-2xl font-bold mb-3">Contest Archive</h2>
              <p className="text-zinc-500 leading-relaxed text-sm">Analyze past rounds, view official editorials, and practice under real contest conditions.</p>
              <div className="mt-6 text-purple-500 font-bold text-sm inline-flex items-center gap-2">View Archive <span>→</span></div>
            </Link>
          </div>

          {/* 4. UPCOMING CONTESTS LIST */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Upcoming Rounds</h3>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            
            <div className="space-y-10">
              <div className="group cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="text-center min-w-[40px]">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Mar</p>
                    <p className="text-xl font-bold text-white">15</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-200 group-hover:text-blue-400 transition-colors text-sm">Global Round #25</h4>
                    <p className="text-xs text-zinc-500 mt-1 uppercase">18:00 UTC • 120 mins</p>
                  </div>
                </div>
              </div>

              <div className="group cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="text-center min-w-[40px]">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Mar</p>
                    <p className="text-xl font-bold text-white">22</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-200 group-hover:text-blue-400 transition-colors text-sm">Educational Round #164</h4>
                    <p className="text-xs text-zinc-500 mt-1 uppercase">14:00 UTC • 120 mins</p>
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full mt-12 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-colors uppercase tracking-widest">
              Register for Contests
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}