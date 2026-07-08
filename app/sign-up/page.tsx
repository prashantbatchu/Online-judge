"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // 1. Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 2. Send POST request to /api/sign-up
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Redirect to login or playground on success
        router.push('/log-in');
      } else {
        setError(result.message || "Failed to create account.");
      }
    } catch (err) {
      setError("Network error. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* LEFT SIDE: BRANDING & TERMINAL DECOR */}
        <div className="hidden lg:flex flex-col gap-8">
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter mb-4">
              JOIN <span className="text-blue-600">BIG_OJ</span>
            </h1>
            <p className="text-zinc-500 text-lg leading-relaxed">
              Initialize your profile to track submissions, participate in 
              global contests, and master algorithms.
            </p>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 font-mono text-xs space-y-2 opacity-60">
            <p className="text-blue-500">{"$"} system --initialize-new-user</p>
            <p className="text-zinc-600">{"[INFO]"} Checking server availability...</p>
            <p className="text-green-500">{"[OK]"} Global Node Cluster Online</p>
            <p className="text-zinc-600">{"[INFO]"} Awaiting credentials...</p>
            <div className="w-2 h-4 bg-zinc-700 animate-pulse inline-block ml-1"></div>
          </div>
        </div>

        {/* RIGHT SIDE: SIGNUP FORM */}
        <div className="bg-zinc-900/20 border border-zinc-800 p-10 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-sm text-zinc-500 font-medium">Already have an account? <Link href="/log-in" className="text-blue-500 hover:underline">Login</Link></p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold uppercase tracking-widest p-4 rounded-xl text-center animate-in fade-in slide-in-from-top-1">
                <span className="mr-2">⚠️</span> {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Username</label>
              <input 
                type="text" 
                name='username'
                placeholder="coder_404"
                value={formData.username}
                onChange={handleChange}
                className="w-full bg-black/50 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Email Address</label>
              <input 
                type="email" 
                name='email'
                placeholder="dev@bigoj.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-black/50 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-zinc-800"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-black/50 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Confirm Password</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-black/50 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-zinc-800"
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-[0.3em] py-5 rounded-2xl shadow-[0_10px_40px_rgba(37,99,235,0.2)] transition-all active:scale-[0.98]"
              >
                {/* Create account */}
                {isSubmitting ? "Processing..." : "Create Account"}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-zinc-800/50 flex flex-col items-center gap-4">
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Or Secure Sign up With (unavailable for now)</span>
            <div className="flex gap-4">
              <button className="h-12 w-12 bg-zinc-800/40 border border-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-700 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </button>
              <button className="h-12 w-12 bg-zinc-800/40 border border-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-700 transition-all text-white font-bold text-xs">
                G+
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}