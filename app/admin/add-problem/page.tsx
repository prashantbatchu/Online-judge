"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AddProblemPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'Easy',
    tags: '',
    testCases: [{ input: '', output: '' }]
  });

  // Check if current user is admin
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // We'll also verify this on the backend for real security
    if (user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
       // Note: process.env.NEXT_PUBLIC is needed to see it on frontend
       router.push('/'); 
    }
  }, []);

  const addTestCase = () => {
    setFormData({
      ...formData,
      testCases: [...formData.testCases, { input: '', output: '' }]
    });
  };
  const removeTestCase = (indexToRemove: number) => {
  // Prevent deleting the very last test case if you want to ensure at least one exists
    if (formData.testCases.length <= 1) {
        alert("At least one test case is required.");
        return;
    }

    setFormData({
        ...formData,
        testCases: formData.testCases.filter((_, index) => index !== indexToRemove)
    });
    };
  const handleTestCaseChange = (index: number, field: 'input' | 'output', value: string) => {
    const newTestCases = [...formData.testCases];
    newTestCases[index][field] = value;
    setFormData({ ...formData, testCases: newTestCases });
  };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // Convert the string into an array of trimmed tags
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== ""); // Remove empty strings

      const submissionData = {
        ...formData,
        tags: tagsArray // Replace string with the new array
      };

      const res = await fetch('/api/problems/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (res.ok) {
        alert("Problem initialized in Database!");
        router.push('/problems');
      }
    };
  const gotohome=async()=>{
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-black text-white p-12 mx-auto w-[75%]">
      <button
      onClick={gotohome}
                className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-all"
              > {"< "}GO TO HOME 
                </button>
      <h1 className="text-3xl font-black mb-8 text-blue-500 tracking-tighter uppercase mx-auto w-[75%]">{"$"} System --push-challenge</h1>
      
      <form onSubmit={handleSubmit} className="mx-auto w-[75%] space-y-8 bg-zinc-900/30 p-8 rounded-3xl border border-zinc-800">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Problem Title</label>
            <input 
              className="w-full bg-black border border-zinc-800 rounded-xl p-4 focus:border-blue-500 outline-none"
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. Sum of Two Integers"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Difficulty</label>
            <select 
              className="w-full bg-black border border-zinc-800 rounded-xl p-4 outline-none"
              onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Description (Markdown Supported)</label>
          <textarea 
            rows={6}
            className="w-full bg-black border border-zinc-800 rounded-xl p-4 focus:border-blue-500 outline-none"
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Tags (Comma Separated)
            </label>
            <input 
              className="w-full bg-black border border-zinc-800 rounded-xl p-4 focus:border-blue-500 outline-none"
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              placeholder="DP, Graphs, Strings..."
              value={formData.tags}
            />
            
            {/* LIVE TAG PREVIEW */}
            <div className="flex flex-wrap gap-2 pt-2">
              {formData.tags.split(',').map((tag, i) => (
                tag.trim() !== "" && (
                  <span key={i} className="text-[9px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-1 rounded-md font-bold uppercase tracking-widest">
                    {tag.trim()}
                  </span>
                )
              ))}
            </div>
          </div>

        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Test Cases (Hidden from users)
                </h3>
                <button 
                type="button" 
                onClick={addTestCase} 
                className="text-blue-500 text-xs font-bold hover:text-blue-400 transition-colors uppercase tracking-tighter"
                >
                + Add Case
                </button>
            </div>
            
            {formData.testCases.map((tc, index) => (
                <div key={index} className="relative group">
                {/* DELETE BUTTON */}
                <button
                    type="button"
                    onClick={() => removeTestCase(index)}
                    className="absolute -right-2 -top-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500 shadow-lg"
                    title="Remove Test Case"
                >
                    ✕
                </button>

                <div className="grid grid-cols-2 gap-4 p-4 border border-zinc-800 rounded-2xl bg-black/40 focus-within:border-zinc-600 transition-all">
                    <textarea 
                    placeholder="Input" 
                    value={tc.input} // Added value to keep it controlled
                    className="bg-transparent text-xs p-2 outline-none border-r border-zinc-800 min-h-[80px] resize-none"
                    onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                    />
                    <textarea 
                    placeholder="Expected Output" 
                    value={tc.output} // Added value to keep it controlled
                    className="bg-transparent text-xs p-2 outline-none min-h-[80px] resize-none"
                    onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                    />
                </div>
                </div>
            ))}
            </div>

        <button type="submit" className="w-full py-4 bg-blue-600 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-blue-500 transition-all">
          Upload to Global Problem Set
        </button>
      </form>
    </div>
  );
}