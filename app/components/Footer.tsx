import React from 'react'
import Link from 'next/link'

const Footer = () => {
  return (
    <footer className="w-full border-t border-zinc-800 bg-zinc-950 py-12 mt-auto">
      <div className="w-[75%] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand Section */}
        <div className="md:col-span-1">
          <h3 className="text-blue-500 font-bold text-xl mb-4 font-mono">BIG_OJ</h3>
          <p className="text-zinc-500 text-sm leading-relaxed mb-6">
            Level up your logic with world-class algorithmic challenges. Built for the next generation of engineers.
          </p>
          <div className="flex gap-4">
            {/* You can add actual SVGs here for GitHub/Discord */}
            <div className="w-5 h-5 bg-zinc-800 rounded hover:bg-zinc-700 cursor-pointer transition"></div>
            <div className="w-5 h-5 bg-zinc-800 rounded hover:bg-zinc-700 cursor-pointer transition"></div>
          </div>
        </div>

        {/* Resources */}
        <div>
          <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-[0.2em]">Platform</h4>
          <ul className="text-zinc-500 text-sm space-y-3">
            <li className="hover:text-blue-400 cursor-pointer transition"><Link href="/problems">Problem Set</Link></li>
            <li className="hover:text-blue-400 cursor-pointer transition"><Link href="/contests">Contest Archive</Link></li>
            <li className="hover:text-blue-400 cursor-pointer transition">Leaderboard</li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-[0.2em]">Community</h4>
          <ul className="text-zinc-500 text-sm space-y-3">
            <li className="hover:text-blue-400 cursor-pointer transition">Official Editorials</li>
            <li className="hover:text-blue-400 cursor-pointer transition">Community Discord</li>
            <li className="hover:text-blue-400 cursor-pointer transition">GitHub Hub</li>
          </ul>
        </div>

        {/* Newsletter / Status */}
        <div>
          <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-[0.2em]">System Status</h4>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-zinc-500 text-xs">All Systems Operational</span>
          </div>
          <p className="text-[10px] text-zinc-600 italic">
            "Better to be a warrior in a garden than a gardener in a war."
          </p>
        </div>
      </div>

      <div className="w-[75%] mx-auto mt-12 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-zinc-600 text-[10px] uppercase tracking-widest">
          © {new Date().getFullYear()} BIG_OJ. All Rights Reserved.
        </p>
        <div className="flex gap-6 text-[10px] text-zinc-600 uppercase tracking-widest">
          <span className="hover:text-zinc-400 cursor-pointer">Privacy</span>
          <span className="hover:text-zinc-400 cursor-pointer">Terms</span>
          <span className="hover:text-zinc-400 cursor-pointer">Cookies</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer