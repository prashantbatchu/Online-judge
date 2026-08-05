"use client"
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from "next/navigation";

const Navbar = () => {
  // Store the actual user object instead of just a boolean
  const [user, setUser] = useState<{ username: string; email: string; role?: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({ left: 0, width: 0 });

  // 1. Check for logged in user on load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // 2. Sliding underline logic (Keep your existing logic)
  useEffect(() => {
    const activeLink = containerRef.current?.querySelector(
      `[data-path="${pathname}"]`
    ) as HTMLElement;
    
    if (activeLink) {
      setStyle({
        left: activeLink.offsetLeft,
        width: activeLink.offsetWidth,
      });
    }
  }, [pathname]);

  // 3. Logout Handler
  const handleLogout = async () => {
    localStorage.removeItem('user'); // Clear local storage
    setUser(null);                   // Reset state
    
    // Clear the cookie on the server
    await fetch('/api/logout', { method: 'POST' });
    
    router.push('/'); // Send them home
    router.refresh();
  };

  return (
    <div className="w-[75%] mx-auto flex flex-col">
      <div className="w-full flex items-center justify-between py-4 px-3">
        <Link href="/" className="text-2xl font-bold tracking-tighter">
          Big_<span className="text-blue-500">OJ</span>
        </Link>

        {/* Dynamic Auth Section */}
        <div className="flex gap-4 items-center"> 
          
          {user ? (
            <>
              <span className="text-sm font-bold text-blue-400">
                {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-all"
              >
                LOGOUT
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/log-in"
                className="px-4 py-1.5 text-xs font-bold hover:text-blue-500 transition-all"
              >
                LOGIN
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-1.5 bg-blue-600 rounded-lg text-xs font-bold hover:bg-blue-500 transition-all"
              >
                SIGNUP
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links with your sliding underline */}
      <div className='flex justify-between border border-zinc-800 rounded-xl mb-2 bg-zinc-900/20 backdrop-blur-sm'>
        <div className="relative flex gap-6 px-4 pt-3 pb-3 font-mono text-xs tracking-widest" ref={containerRef}>
          <Link href="/" data-path="/" className="relative hover:text-white transition-colors">HOME</Link>
          <Link href="/problems" data-path="/problems" className="relative hover:text-white transition-colors">PROBLEMS</Link>
          <Link href="/contest" data-path="/contest" className="relative hover:text-white transition-colors">CONTEST</Link>
          <Link href="/playground" data-path="/playground" className="relative hover:text-white transition-colors">PLAYGROUND</Link>
          <Link href="/profile" data-path="/profile" className="relative hover:text-white transition-colors">PROFILE</Link>
          
          {user && user.role === "admin" && (
            <Link
              href="/admin/add-problem"
              className="px-3 py-1 border border-blue-500/30 text-blue-500 text-[10px] font-black rounded-md hover:bg-blue-500 hover:text-white transition-all tracking-widest uppercase mt-[-4]"
            >
              + Add Problem
            </Link>
          )}  
          <span
            className="absolute bottom-2 h-[2px] bg-blue-500 transition-all duration-300 ease-in-out"            
            style={{
              left: style.left,
              width: style.width,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Navbar;