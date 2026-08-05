"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

type Problem = {
  _id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
};

type Contest = {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  problems: Problem[];
  participants: string[];
  createdAt: string;
};

const diffColor: Record<string, string> = {
  Easy: "text-green-400 border-green-500/20",
  Medium: "text-yellow-400 border-yellow-500/20",
  Hard: "text-red-400 border-red-500/20",
};

function getStatus(start: string, end: string) {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (now < s) return "upcoming";
  if (now >= s && now <= e) return "live";
  return "ended";
}

function formatDuration(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} mins`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function CountdownTimer({ target }: { target: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Started");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return <span className="font-mono text-blue-400">{remaining}</span>;
}

export default function ContestPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "live" | "ended">(
    "all"
  );
  const [registering, setRegistering] = useState<string | null>(null);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

  useEffect(() => {
    fetch("/api/contests")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setContests(data.contests);
          // Check which ones current user is already in
          if (user._id) {
            const already = new Set<string>(
              data.contests
                .filter((c: Contest) =>
                  c.participants.some((p) => p.toString() === user._id)
                )
                .map((c: Contest) => c._id)
            );
            setRegisteredIds(already);
          }
        }
        setLoading(false);
      });
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRegister = async (contestId: string) => {
    if (!user._id) {
      showToast("Please log in to register.", "error");
      return;
    }
    setRegistering(contestId);
    try {
      const res = await fetch(`/api/contests/${contestId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // No body needed — the server identifies the registrant from the
        // session cookie.
      });
      const data = await res.json();
      if (res.status === 401) {
        showToast("Please log in to register.", "error");
        return;
      }
      if (data.success) {
        setRegisteredIds((prev) => new Set([...prev, contestId]));
        showToast("Registered successfully!", "success");
      } else {
        showToast(data.message || "Registration failed.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setRegistering(null);
    }
  };

  const filtered =
    filter === "all"
      ? contests
      : contests.filter((c) => getStatus(c.startTime, c.endTime) === filter);

  const stats = {
    live: contests.filter((c) => getStatus(c.startTime, c.endTime) === "live")
      .length,
    upcoming: contests.filter(
      (c) => getStatus(c.startTime, c.endTime) === "upcoming"
    ).length,
    ended: contests.filter((c) => getStatus(c.startTime, c.endTime) === "ended")
      .length,
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl border text-xs font-black uppercase tracking-widest shadow-2xl transition-all ${
            toast.type === "success"
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="w-[78%] mx-auto py-10">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2">
              Contest <span className="text-blue-500">Archive</span>
            </h1>
            <p className="text-zinc-500 text-sm">
              Participate in contests and track your performance.
            </p>
          </div>

          {/* Admin: Add Contest */}
          {user?.role === "admin" && (
            <Link
              href="/admin/add-contest"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
            >
              + New Contest
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                Live Now
              </p>
              <p className="text-2xl font-black text-green-400">
                {stats.live}
              </p>
            </div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
              Upcoming
            </p>
            <p className="text-2xl font-black text-blue-400">{stats.upcoming}</p>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
              Ended
            </p>
            <p className="text-2xl font-black text-zinc-400">{stats.ended}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "live", "upcoming", "ended"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                filter === f
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Contest Cards */}
        {loading ? (
          <div className="py-20 text-center">
            <p className="text-blue-500 font-mono animate-pulse text-xs uppercase tracking-widest">
              {">"} Fetching contests...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
            <p className="text-zinc-600 font-mono text-xs uppercase tracking-widest">
              No {filter === "all" ? "" : filter} contests found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((contest) => {
              const status = getStatus(contest.startTime, contest.endTime);
              const isRegistered = registeredIds.has(contest._id);

              return (
                <div
                  key={contest._id}
                  className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-6">
                    {/* Left: Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Status Badge */}
                        {status === "live" && (
                          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-green-400 border border-green-500/20 bg-green-500/5 px-2 py-1 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            Live
                          </span>
                        )}
                        {status === "upcoming" && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 border border-blue-500/20 bg-blue-500/5 px-2 py-1 rounded-lg">
                            Upcoming
                          </span>
                        )}
                        {status === "ended" && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 border border-zinc-700 px-2 py-1 rounded-lg">
                            Ended
                          </span>
                        )}
                        <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-tighter">
                          {formatDuration(contest.startTime, contest.endTime)}
                        </span>
                      </div>

                      <h2 className="text-xl font-black tracking-tight mb-2">
                        {contest.title}
                      </h2>

                      {contest.description && (
                        <p className="text-zinc-500 text-sm mb-4 leading-relaxed">
                          {contest.description}
                        </p>
                      )}

                      {/* Time Info */}
                      <div className="flex gap-8 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">
                        <div>
                          <span className="block text-zinc-700 mb-0.5">
                            Start
                          </span>
                          <span className="text-zinc-400">
                            {new Date(contest.startTime).toLocaleString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="block text-zinc-700 mb-0.5">End</span>
                          <span className="text-zinc-400">
                            {new Date(contest.endTime).toLocaleString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                        {status === "upcoming" && (
                          <div>
                            <span className="block text-zinc-700 mb-0.5">
                              Starts In
                            </span>
                            <CountdownTimer target={contest.startTime} />
                          </div>
                        )}
                        {status === "live" && (
                          <div>
                            <span className="block text-zinc-700 mb-0.5">
                              Ends In
                            </span>
                            <CountdownTimer target={contest.endTime} />
                          </div>
                        )}
                        <div>
                          <span className="block text-zinc-700 mb-0.5">
                            Participants
                          </span>
                          <span className="text-zinc-400">
                            {contest.participants.length}
                          </span>
                        </div>
                      </div>

                      {/* Problems List */}
                      {contest.problems.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">
                            Problems ({contest.problems.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {contest.problems.map((p, i) => (
                              <span
                                key={p._id}
                                className={`text-[10px] px-2 py-1 rounded-lg border font-bold ${
                                  diffColor[p.difficulty]
                                } bg-zinc-900/60`}
                              >
                                {String.fromCharCode(65 + i)}. {p.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col items-end gap-3 min-w-[140px]">
                      {status === "live" ? (
                        <>
                          {isRegistered ? (
                            <Link
                              href={`/contest/${contest._id}`}
                              className="w-full text-center px-5 py-3 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                            >
                              Enter Contest
                            </Link>
                          ) : (
                            <button
                              onClick={() => handleRegister(contest._id)}
                              disabled={registering === contest._id}
                              className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                            >
                              {registering === contest._id
                                ? "Registering..."
                                : "Register & Enter"}
                            </button>
                          )}
                        </>
                      ) : status === "upcoming" ? (
                        <>
                          {isRegistered ? (
                            <div className="w-full text-center px-5 py-3 bg-zinc-800 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-green-500/20">
                              ✓ Registered
                            </div>
                          ) : (
                            <button
                              onClick={() => handleRegister(contest._id)}
                              disabled={registering === contest._id}
                              className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                            >
                              {registering === contest._id
                                ? "Registering..."
                                : "Register"}
                            </button>
                          )}
                        </>
                      ) : (
                        <Link
                          href={`/contest/${contest._id}`}
                          className="w-full text-center px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-zinc-700"
                        >
                          View Results
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
