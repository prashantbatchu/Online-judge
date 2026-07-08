"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);

  const currentUser = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("user") || "{}") : {};

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(r => r.json())
      .then(d => { if (d.success) setLeaderboard(d.leaderboard); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const bg    = isDark ? "bg-[#060606] text-zinc-300"     : "bg-zinc-100 text-zinc-800";
  const panel = isDark ? "bg-zinc-900/40 border-zinc-800"  : "bg-white border-zinc-200";
  const sub   = isDark ? "text-zinc-500"                   : "text-zinc-500";
  const rowHover = isDark ? "hover:bg-zinc-800/30" : "hover:bg-zinc-50";
  const divider  = isDark ? "divide-zinc-800"      : "divide-zinc-200";
  const medals = ["🥇", "🥈", "🥉"];

  const topThree = leaderboard.slice(0, 3);
  const rest     = leaderboard.slice(3);

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      <div className="w-[70%] mx-auto py-12 px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tighter">
              Leader<span className="text-blue-500">board</span>
            </h1>
            <p className={`text-xs mt-1 ${sub}`}>
              Ranked by unique problems solved
            </p>
          </div>
          <button
            onClick={() => setIsDark(d => !d)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${isDark ? "bg-zinc-800 border-zinc-700 text-yellow-400" : "bg-white border-zinc-300 text-zinc-600"}`}
          >
            {isDark ? "☀" : "☽"}
          </button>
        </div>

        {loading ? (
          <div className={`text-center py-20 animate-pulse text-xs ${sub} uppercase tracking-widest`}>
            Loading leaderboard...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-20">
            <p className={`text-xs uppercase tracking-widest font-black ${sub}`}>
              No submissions yet. Be the first!
            </p>
            <Link href="/problems" className="mt-4 inline-block text-blue-500 text-xs hover:underline">
              Start solving →
            </Link>
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {topThree.length >= 1 && (
              <div className="flex items-end justify-center gap-4 mb-12">
                {/* 2nd place */}
                {topThree[1] && (
                  <div className={`flex flex-col items-center p-5 border rounded-2xl w-44 ${panel} ${topThree[1].username === currentUser.username ? "border-blue-500/50" : ""}`}>
                    <span className="text-3xl mb-2">🥈</span>
                    <p className="font-black text-sm truncate w-full text-center">{topThree[1].username}</p>
                    <p className="text-blue-400 font-mono font-black text-xl mt-1">{topThree[1].solved}</p>
                    <p className={`text-[9px] uppercase tracking-widest ${sub}`}>solved</p>
                    {topThree[1].streak > 0 && (
                      <p className="text-orange-400 text-[10px] font-black mt-1">🔥 {topThree[1].streak} day streak</p>
                    )}
                  </div>
                )}

                {/* 1st place — taller */}
                <div className={`flex flex-col items-center p-5 border rounded-2xl w-48 mb-4 ${panel} border-yellow-500/30 ${topThree[0].username === currentUser.username ? "border-blue-500/50" : ""}`}>
                  <span className="text-4xl mb-2">🥇</span>
                  <p className="font-black text-base truncate w-full text-center">{topThree[0].username}</p>
                  <p className="text-blue-400 font-mono font-black text-2xl mt-1">{topThree[0].solved}</p>
                  <p className={`text-[9px] uppercase tracking-widest ${sub}`}>solved</p>
                  {topThree[0].streak > 0 && (
                    <p className="text-orange-400 text-[10px] font-black mt-1">🔥 {topThree[0].streak} day streak</p>
                  )}
                </div>

                {/* 3rd place */}
                {topThree[2] && (
                  <div className={`flex flex-col items-center p-5 border rounded-2xl w-44 ${panel} ${topThree[2].username === currentUser.username ? "border-blue-500/50" : ""}`}>
                    <span className="text-3xl mb-2">🥉</span>
                    <p className="font-black text-sm truncate w-full text-center">{topThree[2].username}</p>
                    <p className="text-blue-400 font-mono font-black text-xl mt-1">{topThree[2].solved}</p>
                    <p className={`text-[9px] uppercase tracking-widest ${sub}`}>solved</p>
                    {topThree[2].streak > 0 && (
                      <p className="text-orange-400 text-[10px] font-black mt-1">🔥 {topThree[2].streak} day streak</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Full table */}
            <div className={`border rounded-2xl overflow-hidden ${panel}`}>
              {/* Table header */}
              <div className={`grid grid-cols-12 px-6 py-3 text-[10px] font-black uppercase tracking-widest ${isDark ? "bg-zinc-800/40 text-zinc-500" : "bg-zinc-100 text-zinc-500"}`}>
                <span className="col-span-1">Rank</span>
                <span className="col-span-5">User</span>
                <span className="col-span-2 text-center">Solved</span>
                <span className="col-span-2 text-center">Streak</span>
                <span className="col-span-2 text-center">Badge</span>
              </div>

              <div className={`divide-y ${divider}`}>
                {leaderboard.map((entry: any, i: number) => {
                  const isMe = entry.username === currentUser.username;
                  const badge =
                    i === 0 ? "🏆 Champion" :
                    i === 1 ? "⚡ Elite"    :
                    i === 2 ? "🔥 Expert"   :
                    entry.solved >= 50 ? "💎 Diamond" :
                    entry.solved >= 20 ? "🌟 Gold"    :
                    entry.solved >= 10 ? "🥈 Silver"  :
                    entry.solved >= 1  ? "🥉 Bronze"  : "—";

                  return (
                    <div
                      key={entry.username}
                      className={`grid grid-cols-12 px-6 py-4 items-center transition-colors ${rowHover} ${isMe ? (isDark ? "bg-blue-500/5 border-l-2 border-blue-500" : "bg-blue-50 border-l-2 border-blue-500") : ""}`}
                    >
                      {/* Rank */}
                      <span className="col-span-1 font-mono font-black text-sm">
                        {medals[i] ?? `#${i + 1}`}
                      </span>

                      {/* Username */}
                      <div className="col-span-5 flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${isDark ? "bg-zinc-800" : "bg-zinc-100"}`}>
                          {entry.username[0]?.toUpperCase()}
                        </div>
                        <span className={`font-bold text-sm ${isMe ? "text-blue-400" : ""}`}>
                          {entry.username}
                          {isMe && <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">You</span>}
                        </span>
                      </div>

                      {/* Solved */}
                      <span className="col-span-2 text-center font-mono font-black text-blue-400 text-lg">
                        {entry.solved}
                      </span>

                      {/* Streak */}
                      <span className={`col-span-2 text-center text-sm font-bold ${entry.streak > 0 ? "text-orange-400" : sub}`}>
                        {entry.streak > 0 ? `🔥 ${entry.streak}` : "—"}
                      </span>

                      {/* Badge */}
                      <span className={`col-span-2 text-center text-[10px] font-black`}>
                        {badge}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}