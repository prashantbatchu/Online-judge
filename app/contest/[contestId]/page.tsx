"use client";
import React, { useEffect, useState, use } from "react";
import Link from "next/link";

type Problem = {
  _id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags?: string[];
};

type Contest = {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  problems: Problem[];
  participants: string[];
};

const diffColor: Record<string, string> = {
  Easy: "text-green-400 border-green-500/20 bg-green-500/5",
  Medium: "text-yellow-400 border-yellow-500/20 bg-yellow-500/5",
  Hard: "text-red-400 border-red-500/20 bg-red-500/5",
};

function getStatus(start: string, end: string) {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (now < s) return "upcoming";
  if (now >= s && now <= e) return "live";
  return "ended";
}

function CountdownTimer({ target }: { target: string }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("00:00:00");
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
  return <span className="font-mono">{remaining}</span>;
}

export default function ContestDetailPage({
  params,
}: {
  params: Promise<{ contestId: string }>;
}) {
  const { contestId } = use(params);

  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const user =
    typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};

  useEffect(() => {
    fetch(`/api/contests/${contestId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setContest(data.contest);
          if (user._id) {
            setIsRegistered(
              data.contest.participants.some((p: string) => p.toString() === user._id)
            );
          }
        } else {
          setNotFound(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [contestId]);

  useEffect(() => {
    if (!user._id) return;
    fetch(`/api/submissions/user/${user._id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const ids = new Set<string>(
            data.submissions
              .filter((s: any) => s.status === "Accepted")
              .map((s: any) => s.problem?._id?.toString())
          );
          setSolvedIds(ids);
        }
      })
      .catch(() => {});
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRegister = async () => {
    if (!user._id) {
      showToast("Please log in to register.", "error");
      return;
    }
    setRegistering(true);
    try {
      const res = await fetch(`/api/contests/${contestId}/register`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setIsRegistered(true);
        showToast("Registered successfully!", "success");
      } else {
        showToast(data.message || "Registration failed.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-blue-500 font-mono animate-pulse text-xs uppercase tracking-widest">
          {">"} Loading contest...
        </p>
      </div>
    );
  }

  if (notFound || !contest) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400 font-mono text-lg">Contest not found.</p>
        <Link href="/contest" className="text-blue-500 text-sm hover:underline">
          ← Back to Contest Archive
        </Link>
      </div>
    );
  }

  const status = getStatus(contest.startTime, contest.endTime);

  return (
    <div className="min-h-screen bg-black text-white">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl border text-xs font-black uppercase tracking-widest shadow-2xl ${
            toast.type === "success"
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="w-[78%] mx-auto py-10">
        <Link
          href="/contest"
          className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors mb-6 inline-block"
        >
          {"< "}Back to Contest Archive
        </Link>

        <div className="flex items-start justify-between gap-6 mb-8 mt-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
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
            </div>
            <h1 className="text-3xl font-black tracking-tighter mb-2">{contest.title}</h1>
            {contest.description && (
              <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed">{contest.description}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-3 min-w-[160px]">
            {status !== "ended" &&
              (isRegistered ? (
                <div className="w-full text-center px-5 py-3 bg-zinc-800 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-green-500/20">
                  ✓ Registered
                </div>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                >
                  {registering ? "Registering..." : "Register"}
                </button>
              ))}
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">
              {contest.participants.length} participant{contest.participants.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Start</p>
            <p className="text-sm font-bold text-zinc-300">
              {new Date(contest.startTime).toLocaleString(undefined, {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">End</p>
            <p className="text-sm font-bold text-zinc-300">
              {new Date(contest.endTime).toLocaleString(undefined, {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
              {status === "upcoming" ? "Starts In" : status === "live" ? "Ends In" : "Duration"}
            </p>
            <p className="text-sm font-bold text-blue-400">
              {status === "upcoming" && <CountdownTimer target={contest.startTime} />}
              {status === "live" && <CountdownTimer target={contest.endTime} />}
              {status === "ended" && "Contest ended"}
            </p>
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">
              Problems ({contest.problems.length})
            </h2>
          </div>
          {contest.problems.length === 0 ? (
            <p className="p-10 text-center text-zinc-600 text-xs font-mono uppercase tracking-widest">
              No problems have been added to this contest yet.
            </p>
          ) : (
            <div className="divide-y divide-zinc-800">
              {contest.problems.map((p, i) => {
                const solved = solvedIds.has(p._id);
                const canOpen = status !== "upcoming";
                return (
                  <div key={p._id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800/60 text-xs font-black text-zinc-400">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {canOpen ? (
                        <Link href={`/problems/${p._id}`} className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
                          {p.title}
                        </Link>
                      ) : (
                        <span className="font-medium text-zinc-500">{p.title} (locked until start)</span>
                      )}
                      <span className={`text-[10px] px-2 py-1 rounded-lg border font-bold ${diffColor[p.difficulty]}`}>
                        {p.difficulty}
                      </span>
                    </div>
                    {solved && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-green-400">
                        ✓ Solved
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
