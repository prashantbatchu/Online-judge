"use client";
import React, { useState } from 'react';
import Link from 'next/link';


export default function LoginPage() {
    
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(result.user));
        window.location.href = "/";
        
      } else {
        setError(result.message || "Invalid credentials.");
      }
    } catch (err) {
      setError("Connection failed. Please check your network.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        
        {/* LOGO AREA */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
            BIG_<span className="text-blue-600">OJ</span>
          </h1>
          <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">
            Authentication Required
          </p>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-zinc-900/20 border border-zinc-800 p-8 rounded-[2rem] backdrop-blur-xl shadow-2xl">
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold uppercase tracking-widest p-4 rounded-xl mb-6 text-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Terminal ID (Email)</label>
              <input 
                name="email"
                type="email" 
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="dev@bigoj.com"
                className="w-full bg-black/50 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-zinc-900"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Access Key</label>
                <Link href="/" className="text-[9px] font-bold text-zinc-600 hover:text-blue-500 uppercase tracking-widest">Lost Key?</Link>
              </div>
              <input 
                name="password"
                type="password" 
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-black/50 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-zinc-900"
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-[0.3em] py-5 rounded-2xl shadow-[0_10px_40px_rgba(37,99,235,0.2)] transition-all active:scale-[0.98] mt-4 disabled:bg-zinc-800 disabled:text-zinc-600"
            >
              {isSubmitting ? "Verifying..." : "Authorize Access"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-zinc-600">
              New to the system? <Link href="/sign-up" className="text-blue-500 font-bold hover:underline">Register Node</Link>
            </p>
          </div>
        </div>

        {/* SYSTEM STATUS DECOR */}
        <div className="mt-8 flex justify-center gap-4 opacity-30">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[9px] font-black uppercase tracking-tighter">Database: OK</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[9px] font-black uppercase tracking-tighter">SSL: ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}