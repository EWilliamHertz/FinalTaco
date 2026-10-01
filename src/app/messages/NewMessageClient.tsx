"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { searchUsers } from "@/app/actions/user";

export function NewMessageClient() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 1) {
      const users = await searchUsers(val);
      setResults(users);
    } else {
      setResults([]);
    }
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="px-6 py-2 bg-white text-black hover:bg-neutral-200 transition-colors rounded-lg font-sans text-xs uppercase tracking-widest"
      >
        New Message
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-white/10 p-6 rounded-xl w-full max-w-md relative">
            <h2 className="font-serif text-2xl text-white mb-4">Start Conversation</h2>
            <input 
              type="text" 
              placeholder="Search for a user..."
              value={query}
              onChange={handleSearch}
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 font-sans mb-4"
              autoFocus
            />
            <div className="max-h-60 overflow-y-auto space-y-2">
              {results.map(u => (
                <div 
                  key={u.id}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/messages/${u.username}`);
                  }}
                  className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-black overflow-hidden border border-white/10">
                    {u.avatarUrl && <img src={u.avatarUrl} className="w-full h-full object-cover" alt="" />}
                  </div>
                  <span className="font-serif text-white">{u.username}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
