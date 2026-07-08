"use client";
import React, { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user._id) {
      fetch(`/api/user/profile/${user._id}`)
        .then(res => res.json())
        .then(res => {
          if (res.success) setData(res);
          setLoading(false);
        })
        .catch(err => {
          console.error("Profile fetch error:", err);
          setLoading(false);
        });
    }
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-blue-500 font-mono animate-pulse tracking-widest uppercase">
        {"> "}Initializing Profile Data...
      </div>
    </div>
  );

  if (!data) return <div className="p-20 text-center text-zinc-500">User not found.</div>;
  else console.log(data);
  // --- HEATMAP LOGIC ---
  const getActivityMap = () => {
    const activityMap: Record<string, number> = {};
    data.submissions.forEach((sub: any) => {
      const dateKey = new Date(sub.createdAt).toISOString().split('T')[0];
      activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
    });
    return activityMap;
  };
  const accuracy = () => {
    const total = data.submissions.length;
    if (total === 0) return "0.00";
    const accepted = getSolvedCount(); // unique solved problems
    // Accuracy = accepted / total submissions * 100
    return ((accepted / total) * 100).toFixed(2);
  };


  const generateYearData = () => {
    const days = [];
    const activityMap = getActivityMap();
    const today = new Date();
    // Generate exactly 365 days (52 weeks + 1 day)
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      days.push({
        date: dateString,
        count: activityMap[dateString] || 0
      });
    }
    return days;
  };


  const yearData = generateYearData();
//   const =0;
    const getSolvedCount = () => {
        if (!data || !data.submissions) return 0; // Safety check
        
        let cnt = 0;
        const subs = data.submissions;
        const myset = new Set();
        
        for (let i = 0; i < subs.length; i++) { 
            // myset.add(subs[i].problem._id);
            if (subs[i].status === "Accepted" && !myset.has(subs[i].problem._id)) {
                myset.add(subs[i].problem._id);
                cnt++;
            }
        }
        return cnt;
    };

// In your JSX, you would use it like this:
// <h3>{getSolvedCount()}</h3>
  
  const difficultyCount = (level: string) => {
    // 1. Filter submissions by the specific difficulty level
    const filteredSubmissions = data.submissions.filter(
        (s: any) => s.problem?.difficulty === level
    );

    // 2. Use a Set to extract unique problem IDs
    // (Assuming your problem object has an _id or id field)
    const uniqueProblemIds = new Set(
        filteredSubmissions.map((s: any) => s.problem?._id?.toString())
    );

    // 3. The size of the Set is the number of unique problems solved
    return uniqueProblemIds.size;
    };
  return (
    <div className="min-h-screen bg-black text-white p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* 1. IDENTITY HEADER */}
        <div className="flex flex-col md:flex-row gap-10 items-center md:items-start mb-16">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative w-32 h-32 rounded-3xl bg-zinc-900 flex items-center justify-center text-5xl font-black border border-zinc-800">
              {data.user.username[0].toUpperCase()}
            </div>
          </div>
          
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-5xl font-black tracking-tighter uppercase bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
              {data.user.username}
            </h1>
            <p className="text-zinc-500 font-mono text-sm mt-2 flex items-center justify-center md:justify-start gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {data.user.email}
            </p>
            
            <div className="flex justify-center md:justify-start gap-6 mt-8">
               <StatCard label="Total Solved" value={getSolvedCount()} color="text-blue-400" />
               <StatCard label="Global Rank" value={`#${data.rank || '---'}`} color="text-purple-400" />
               <StatCard label="Accuracy" value={`${accuracy()}%`} color="text-green-400" />
            </div>
          </div>
        </div>

        {/* 2. ACTIVITY HEATMAP */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem] mb-10 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Contribution Matrix</h3>
              <p className="text-[10px] text-zinc-600 font-mono mt-1">Activity over the last 365 days</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-zinc-800/50 rounded-[2px]"></div>
                <div className="w-3 h-3 bg-blue-900/50 rounded-[2px]"></div>
                <div className="w-3 h-3 bg-blue-700/50 rounded-[2px]"></div>   
                <div className="w-3 h-3 bg-blue-500 rounded-[2px]"></div>
              </div>
              <span>More</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
            {yearData.map((day, i) => (
              <div
                key={i}
                title={`${day.date}: ${day.count} accepted`}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] transition-all duration-500 hover:scale-150 hover:z-10 cursor-pointer ${
                  day.count === 0 ? "bg-zinc-800/30" :
                  day.count === 1 ? "bg-blue-900/60" :
                  day.count === 2 ? "bg-blue-700/80" :
                  "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* 3. DIFFICULTY BREAKDOWN */}
          <div className="lg:col-span-1 bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem]">
             <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-8">Skill Proficiency</h3>
             <div className="space-y-8">
                <DifficultyRow label="Easy" count={difficultyCount("Easy")} total={getSolvedCount()} color="bg-green-500" />
                <DifficultyRow label="Medium" count={difficultyCount("Medium")} total={getSolvedCount()} color="bg-yellow-500" />
                <DifficultyRow label="Hard" count={difficultyCount("Hard")} total={getSolvedCount()} color="bg-red-500" />
             </div>
          </div>

          {/* 4. RECENT ACTIVITY LIST */}
        <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem]">
  <div className="flex items-center justify-between mb-8">
    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Recent Activity</h3>
    <button className="text-[10px] text-zinc-500 hover:text-blue-400 uppercase font-bold transition-colors">View All Submissions</button>
  </div>

  <div className="space-y-4">
    {data.submissions && data.submissions.length > 0 ? (
      data.submissions
        .filter((s: any) => s.problem)
        .slice(0, 5)
        .map((s: any) => (
          <div 
            key={s._id} 
            className="group relative flex items-center justify-between p-5 bg-black/40 border border-zinc-800 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-xl hover:shadow-blue-500/5"
          >
            <div className="flex items-center gap-5">
              {/* Left Side: Status Icon */}
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl border ${
                s.status === 'Accepted' 
                  ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                  : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}>
                {s.status === 'Accepted' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                )}
              </div>

              {/* Center: Info */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-zinc-200 group-hover:text-blue-400 transition-colors">
                    {s.problem.title}
                  </span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border ${
                    s.problem.difficulty === 'Easy' ? 'border-green-500/20 text-green-500/70' :
                    s.problem.difficulty === 'Medium' ? 'border-yellow-500/20 text-yellow-500/70' : 
                    'border-red-500/20 text-red-500/70'
                  }`}>
                    {s.problem.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    s.status === 'Accepted' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {s.status}
                  </span>
                  <span className="text-zinc-700 text-[10px]">•</span>
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter">
                    Runtime: {s.runtime || 'N/A'}ms
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Timestamp */}
            <div className="text-right flex flex-col items-end">
              <span className="text-[11px] text-zinc-400 font-mono font-bold">
                {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest mt-1">
                {new Date(s.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))
    ) : (
      <div className="py-16 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-3xl">
        <div className="w-12 h-12 bg-zinc-800/50 rounded-full mb-4"></div>
        <p className="text-zinc-600 font-mono italic text-xs tracking-widest">NO DEPLOYMENTS DETECTED</p>
      </div>
    )}
  </div>
</div>
        </div>
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function StatCard({ label, value, color }: { label: string, value: any, color: string }) {
  return (
    <div className="flex flex-col">
       <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">{label}</p>
       <p className={`text-2xl font-mono font-black ${color} tracking-tighter mt-1`}>{value}</p>
    </div>
  );
}

function DifficultyRow({ label, count, total, color }: any) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="group">
      <div className="flex justify-between text-[10px] font-black uppercase mb-2 tracking-widest">
        <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">{label}</span>
        <span className="text-zinc-400 font-mono">{count}</span>
      </div>
      <div className="w-full h-1.5 bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-800/50">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}