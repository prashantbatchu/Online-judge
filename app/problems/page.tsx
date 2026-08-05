"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ProblemsPage() {
  const [problems, setProblems] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [diffFilter, setDiffFilter] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [isDark, setIsDark] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const [probRes, subRes] = await Promise.all([
          fetch('/api/problems'),
          user._id ? fetch(`/api/submissions/user/${user._id}`) : Promise.resolve(null),
        ]);
        const probData = await probRes.json();
        if (probData.success) setProblems(probData.problems);
        if (subRes) {
          const subData = await subRes.json();
          if (subData.success) setSubmissions(subData.submissions);
        }
      } catch (error) {
        console.error("Data fetch failed", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => { if (d.success) setLeaderboard(d.leaderboard); })
      .catch(() => {});
  }, []);

  const getCount = (level: string) => problems.filter((p: any) => p.difficulty === level).length;
  const easyCount = getCount("Easy");
  const medCount  = getCount("Medium");
  const hardCount = getCount("Hard");
  const total     = problems.length || 1;

  const solvedProblemIds = new Set(
    submissions
      .filter((s: any) => s.status === "Accepted")
      .map((s: any) => s.problem?._id?.toString() ?? s.problem?.toString())
  );
  const solvedCount = solvedProblemIds.size;

  const calculateStreak = (subs: any[]) => {
    if (!subs.length) return 0;
    const dates = [...new Set(subs.map((s: any) => new Date(s.createdAt).toDateString()))];
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const check = new Date();
      check.setDate(check.getDate() - i);
      if (dates.includes(check.toDateString())) streak++;
      else break;
    }
    return streak;
  };
  const currentStreak = calculateStreak(submissions);

  const allTags = [...new Set(problems.flatMap((p: any) => p.tags || []))].sort() as string[];

  const filteredProblems = problems
    .filter((p: any) => {
      const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTag    = !activeTag || p.tags?.includes(activeTag);
      const matchDiff   = diffFilter === "All" || p.difficulty === diffFilter;
      return matchSearch && matchTag && matchDiff;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "difficulty") {
        const order: any = { Easy: 0, Medium: 1, Hard: 2 };
        return order[a.difficulty] - order[b.difficulty];
      }
      return 0;
    });

  const bg       = isDark ? "bg-[#060606] text-zinc-300"    : "bg-zinc-100 text-zinc-800";
  const panel    = isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200";
  const sub      = isDark ? "text-zinc-500"                  : "text-zinc-500";
  const inputCls = isDark
    ? "bg-zinc-900 border-zinc-800 text-zinc-300 placeholder-zinc-600 focus:border-blue-500"
    : "bg-white border-zinc-300 text-zinc-700 placeholder-zinc-400 focus:border-blue-500";
  const rowHover = isDark ? "hover:bg-zinc-800/20" : "hover:bg-zinc-50";
  const theadCls = isDark ? "bg-zinc-800/40 text-zinc-500"  : "bg-zinc-100 text-zinc-500";
  const divider  = isDark ? "divide-zinc-800"                : "divide-zinc-200";
  const medals   = ["🥇", "🥈", "🥉"];

  return (
    <>
      <style>{`
        .tag-chip { transition: background .15s, color .15s, border-color .15s; }
        .row-enter { animation: fadeUp .15s ease; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div className={`min-h-screen ${bg} transition-colors duration-300`}>
        <div className="w-[80%] mx-auto py-10 px-4 font-sans">

          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-black tracking-tighter">Problem Set</h1>
              <p className={`text-xs mt-1 ${sub}`}>{problems.length} problems · {solvedCount} solved</p>
            </div>
            <button
              onClick={() => setIsDark(d => !d)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${isDark ? "bg-zinc-800 border-zinc-700 text-yellow-400" : "bg-white border-zinc-300 text-zinc-600"}`}
            >
              {isDark ? "☀" : "☽"}
            </button>
          </div>

          {/* Analytics cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className={`p-6 border rounded-2xl flex items-center justify-between ${panel}`}>
              <div>
                <p className={`text-xs uppercase tracking-widest font-bold ${sub}`}>Solved</p>
                <h3 className="text-3xl font-mono mt-1">
                  {solvedCount} <span className={`text-xl ${sub}`}>/ {problems.length}</span>
                </h3>
              </div>
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-zinc-800" />
                  <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent"
                    strokeDasharray={150.8}
                    strokeDashoffset={150.8 - (150.8 * (solvedCount / (problems.length || 1)))}
                    strokeLinecap="round" className="text-blue-500 transition-all duration-1000 ease-out" />
                </svg>
                <span className="absolute text-[10px] font-mono font-bold text-zinc-400">
                  {Math.round((solvedCount / (problems.length || 1)) * 100)}%
                </span>
              </div>
            </div>

            <div className={`md:col-span-2 p-6 border rounded-2xl flex items-center gap-10 ${panel}`}>
              <div>
                <p className={`text-xs uppercase tracking-widest font-bold mb-3 ${sub}`}>Difficulty Breakdown</p>
                <div className="space-y-2 w-48">
                  {[
                    ["Easy",   easyCount, "bg-emerald-500"],
                    ["Medium", medCount,  "bg-amber-500"],
                    ["Hard",   hardCount, "bg-rose-500"],
                  ].map(([label, count, color]) => (
                    <div key={label as string} className="flex items-center gap-3">
                      <span className={`text-[9px] font-black w-12 ${sub}`}>{label as string}</span>
                      <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}>
                        <div className={`h-full ${color as string} rounded-full transition-all duration-1000`} style={{ width: `${((count as number) / total) * 100}%` }} />
                      </div>
                      <span className={`text-[9px] font-mono font-black w-4 ${sub}`}>{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`hidden lg:block border-l pl-10 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                <p className={`text-xs uppercase tracking-widest font-bold ${sub}`}>Current Streak</p>
                <h3 className={`text-2xl font-mono mt-1 ${currentStreak > 0 ? "text-orange-500" : ""}`}>
                  {currentStreak > 0 ? "🔥 " : ""}{currentStreak} Days
                </h3>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-10">

            {/* Table */}
            <div className="flex-grow order-2 lg:order-1">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold">Problems</h2>
                  {(["All", "Easy", "Medium", "Hard"] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setDiffFilter(d)}
                      className={`tag-chip text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all ${
                        diffFilter === d
                          ? d === "All"    ? "bg-blue-600 border-blue-500 text-white"
                          : d === "Easy"   ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                          : d === "Medium" ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                                           : "bg-rose-500/20 border-rose-500/40 text-rose-400"
                          : isDark ? "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                                   : "bg-white border-zinc-300 text-zinc-500 hover:text-zinc-700"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search Name..."
                    className={`border text-xs p-2 rounded-lg outline-none transition-all w-48 ${inputCls}`}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className={`border text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-lg outline-none ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-white border-zinc-300 text-zinc-500"}`}
                  >
                    <option value="default">Sort: Default</option>
                    <option value="difficulty">Sort: Difficulty</option>
                    <option value="title">Sort: A → Z</option>
                  </select>
                </div>
              </div>

              {activeTag && (
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${sub}`}>Tag:</span>
                  <button
                    onClick={() => setActiveTag("")}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-blue-600/20 border border-blue-500/30 text-blue-400 px-2 py-1 rounded-lg hover:bg-blue-600/30 transition-all"
                  >
                    {activeTag} ✕
                  </button>
                </div>
              )}

              <div className={`border rounded-2xl overflow-hidden backdrop-blur-sm ${panel}`}>
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className={`${theadCls} text-[10px] uppercase tracking-widest`}><th className="p-4 w-16">#</th><th className="p-4">Title</th><th className="p-4">Topics</th><th className="p-4">Difficulty</th><th className="p-4 text-center w-16">Status</th></tr>
                  </thead>
                  <tbody className={`divide-y ${divider}`}>
                    {filteredProblems.map((prob: any, index: number) => {
                      const solved = solvedProblemIds.has(prob._id);
                      return <tr key={prob._id} className={`${rowHover} transition group cursor-pointer row-enter`}><td className={`p-4 text-center font-mono text-sm ${sub}`}>{prob.number ?? index + 1}</td><td className="p-4"><Link href={`/problems/${prob._id}`} className="flex items-center gap-2 group"><span className={`font-medium transition-colors ${isDark ? "text-blue-400 group-hover:text-blue-300" : "text-blue-600 group-hover:text-blue-500"}`}>{prob.title}</span></Link></td><td className="p-4"><div className="flex flex-wrap gap-1.5">{prob.tags && prob.tags.length > 0 ? prob.tags.map((tag: string) => <button key={tag} onClick={() => setActiveTag(tag === activeTag ? "" : tag)} className={`tag-chip text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${activeTag === tag ? "bg-blue-600/30 border-blue-500/40 text-blue-300" : isDark ? "bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300" : "bg-zinc-100 border-zinc-200 text-zinc-500 hover:border-zinc-400"}`}>{tag}</button>) : <span className={`text-[9px] font-mono italic ${sub}`}>no_tags</span>}</div></td><td className="p-4"><span className={`text-[10px] font-black uppercase tracking-widest ${prob.difficulty === "Easy" ? "text-emerald-400" : prob.difficulty === "Medium" ? "text-amber-400" : "text-rose-400"}`}>{prob.difficulty}</span></td><td className="p-4 text-center">{solved ? <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#34d399" className="mx-auto"><path d="M293-288 100-482l50-50 143 142 51 51-51 51Zm204 0L303-482l51-51 143 143 324-324 51 51-375 375Zm0-203-51-51 172-172 51 51-172 172Z"/></svg> : <div className={`w-3 h-3 rounded-full border mx-auto ${isDark ? "border-zinc-700" : "border-zinc-300"}`} />}</td></tr>;
                    })}
                  </tbody>
                </table>

                {loading && (
                  <div className={`p-10 text-center animate-pulse text-xs ${sub}`}>Fetching problems from database...</div>
                )}
                {!loading && filteredProblems.length === 0 && (
                  <div className="p-12 flex flex-col items-center gap-3">
                    <span className="text-3xl">🔍</span>
                    <p className={`text-xs tracking-widest font-black uppercase ${sub}`}>No problems found</p>
                    <button
                      onClick={() => { setSearchTerm(""); setActiveTag(""); setDiffFilter("All"); }}
                      className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
                {!loading && filteredProblems.length > 0 && (
                  <div className={`px-4 py-3 border-t flex justify-between ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                    <span className={`text-[10px] font-mono ${sub}`}>Showing {filteredProblems.length} of {problems.length}</span>
                    <span className={`text-[10px] font-mono ${sub}`}>{solvedCount} solved ({Math.round((solvedCount / total) * 100)}%)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-64 order-1 lg:order-2 space-y-6">

              {/* Leaderboard */}
              <div className={`border rounded-2xl overflow-hidden ${panel}`}>
                <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? "border-zinc-800 bg-zinc-900/60" : "border-zinc-200 bg-zinc-50"}`}>
                  <h3 className={`text-[10px] font-black uppercase tracking-widest ${sub}`}>🏆 Leaderboard</h3>
                  <Link href="/leaderboard" className="text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors">
                    View All →
                  </Link>
                </div>
                <div className={`divide-y ${divider}`}>
                  {leaderboard.length === 0 ? (
                    <p className={`text-[10px] text-center py-8 italic ${sub}`}>No data yet</p>
                  ) : (
                    leaderboard.slice(0, 6).map((e: any, i: number) => (
                      <div key={e.username} className={`flex items-center gap-3 px-5 py-3 transition-colors ${rowHover}`}>
                        <span className="w-5 text-center text-sm">{medals[i] ?? `#${i + 1}`}</span>
                        <span className={`flex-1 text-xs font-bold truncate ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>{e.username}</span>
                        <div className="flex items-center gap-2">
                          {e.streak > 0 && <span className="text-[9px] text-orange-400 font-black">🔥{e.streak}</span>}
                          <span className="text-[10px] font-mono font-black text-blue-400">{e.solved}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Topic tags */}
              <div className={`border rounded-2xl p-6 ${panel}`}>
                <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${sub}`}>Topic Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag: string) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(tag === activeTag ? "" : tag)}
                      className={`tag-chip text-[10px] px-2 py-1 rounded transition border ${
                        activeTag === tag
                          ? "bg-blue-600 border-blue-500 text-white"
                          : isDark
                          ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-400"
                          : "bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekly contest */}
              <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-2xl p-6">
                <h3 className="text-sm font-bold mb-2 tracking-tight">Weekly Contest</h3>
                <p className={`text-[10px] leading-relaxed mb-4 ${sub}`}>Participate in the upcoming weekend contest and win exclusive badges.</p>
                <Link href="/contest" className="block text-center w-full py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold rounded-lg transition">
                  View Details
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}