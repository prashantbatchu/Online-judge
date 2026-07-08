"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AddContestPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    problemIds: "" as string,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      router.push("/");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const problems = formData.problemIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const res = await fetch("/api/contests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.title,
        description: formData.description,
        startTime: formData.startTime,
        endTime: formData.endTime,
        problems,
      }),
    });

    const data = await res.json();
    if (data.success) {
      router.push("/contest");
    } else {
      setError(data.message || "Failed to create contest.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-12">
      <div className="w-[50%] mx-auto">
        <button
          onClick={() => router.push("/")}
          className="mb-6 text-xs text-zinc-500 hover:text-white transition-colors uppercase tracking-widest font-bold"
        >
          {"< "}Go to Home
        </button>
        <h1 className="text-3xl font-black mb-8 text-blue-500 tracking-tighter uppercase">
          {"$"} Create New Contest
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl uppercase tracking-widest">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-zinc-900/30 p-8 rounded-3xl border border-zinc-800"
        >
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Contest Title
            </label>
            <input
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full bg-black border border-zinc-800 rounded-xl p-4 focus:border-blue-500 outline-none text-sm"
              placeholder="e.g. Big_OJ Round #1"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-black border border-zinc-800 rounded-xl p-4 focus:border-blue-500 outline-none text-sm resize-none"
              placeholder="Brief description of the contest..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Start Time
              </label>
              <input
                required
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className="w-full bg-black border border-zinc-800 rounded-xl p-4 focus:border-blue-500 outline-none text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                End Time
              </label>
              <input
                required
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                className="w-full bg-black border border-zinc-800 rounded-xl p-4 focus:border-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Problem IDs (comma separated MongoDB ObjectIds)
            </label>
            <input
              value={formData.problemIds}
              onChange={(e) =>
                setFormData({ ...formData, problemIds: e.target.value })
              }
              className="w-full bg-black border border-zinc-800 rounded-xl p-4 focus:border-blue-500 outline-none text-sm font-mono"
              placeholder="507f1f77bcf86cd799439011, 507f1f77bcf86cd799439012"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold uppercase tracking-widest text-xs transition-all disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Contest"}
          </button>
        </form>
      </div>
    </div>
  );
}
