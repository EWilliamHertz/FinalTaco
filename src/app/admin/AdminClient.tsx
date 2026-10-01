"use client";
import { toast } from "react-toastify";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, CloudDownload, UserCheck, Shield } from "lucide-react";
import { getCatalogStatus, startCatalogSync } from "@/app/actions/search";
import { getAllUsers, updateUserRole } from "@/app/actions/admin";

export default function AdminClient() {
  const [catalog, setCatalog] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [targetGame, setTargetGame] = useState<"pokemon" | "mtg" | "both">("both");
  
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const status = await getCatalogStatus(targetGame);
      setCatalog(status);
      if (status.sync?.running) setSyncing(true);
    } catch (err) {
      console.error(err);
    }
  }, [targetGame]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    const res = await getAllUsers();
    if (res.success && res.users) setUsers(res.users);
    setLoadingUsers(false);
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchUsers();
  }, [fetchStatus, fetchUsers]);

  useEffect(() => {
    let poll: NodeJS.Timeout;
    if (syncing) {
      poll = setInterval(async () => {
        try {
          const status = await getCatalogStatus(targetGame);
          setCatalog(status);
          if (!status.sync?.running) {
            setSyncing(false);
          }
        } catch (err) {
          console.error(err);
        }
      }, 3000);
    }
    return () => clearInterval(poll);
  }, [syncing, targetGame]);

  const handleFullSync = useCallback(async () => {
    setSyncing(true);
    try {
      await startCatalogSync(targetGame);
    } catch (err) {
      console.error(err);
      setSyncing(false);
    }
  }, [targetGame]);

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    const res = await updateUserRole(userId, newRole);
    if (res.success) {
      fetchUsers();
    } else {
      toast.error(res.error);
    }
  };

  const syncPct = catalog && catalog.groups > 0 ? Math.round((catalog.syncedGroups / catalog.groups) * 100) : 0;

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto space-y-8">
      <h1 className="font-serif text-3xl text-white tracking-widest uppercase">Admin Panel</h1>
      
      <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl text-white font-serif mb-4">Catalog Synchronization</h2>
        
        <div className="flex items-center gap-4 mb-6">
          <label className="text-sm text-neutral-400 font-sans uppercase">Target Game:</label>
          <select 
            value={targetGame} 
            onChange={(e) => setTargetGame(e.target.value as any)}
            className="bg-black/50 border border-white/20 text-white text-sm rounded px-3 py-1 focus:outline-none"
          >
            <option value="both">Both</option>
            <option value="pokemon">Pokémon</option>
            <option value="mtg">Magic: The Gathering</option>
          </select>
        </div>

        {catalog ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900 border border-white/5 rounded-lg px-6 py-4">
            <div className="font-sans text-[10px] uppercase tracking-widest text-neutral-400">
              {catalog.groupsError && catalog.groups === 0 ? (
                <span className="text-rose-400">Catalog status unavailable (Database sleeping or TCGCSV down)</span>
              ) : (
                <>
                  Catalog: <span className="text-white">{catalog.cards.toLocaleString()}</span> cards from{" "}
                  <span className="text-white">{catalog.syncedGroups}</span>/{catalog.groups} sets ({syncPct}%)
                </>
              )}
            </div>
            <button
              onClick={handleFullSync}
              disabled={syncing}
              className="flex items-center gap-2 px-5 py-2 border border-white/10 rounded-lg font-sans text-[10px] uppercase tracking-widest text-neutral-300 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50 shrink-0 bg-white/5"
            >
              {syncing ? <RefreshCw size={12} className="animate-spin" /> : <CloudDownload size={12} />}
              {syncing
                ? `Syncing${catalog.sync.currentGroup ? `: ${catalog.sync.currentGroup}` : ""} ${catalog.sync.total > 0 ? `(${catalog.sync.done}/${catalog.sync.total})` : ""}`
                : "Sync full catalog"}
            </button>
          </div>
        ) : (
          <div className="text-neutral-500 font-serif italic text-sm">Loading catalog status...</div>
        )}
      </div>

      <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl text-white font-serif mb-4 flex items-center gap-2">
          <UserCheck size={20} /> User Management
        </h2>
        
        {loadingUsers ? (
          <div className="text-neutral-500 font-serif italic text-sm">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 px-4 font-sans text-[10px] uppercase tracking-widest text-neutral-500">Username</th>
                  <th className="py-3 px-4 font-sans text-[10px] uppercase tracking-widest text-neutral-500">Email</th>
                  <th className="py-3 px-4 font-sans text-[10px] uppercase tracking-widest text-neutral-500">Role</th>
                  <th className="py-3 px-4 font-sans text-[10px] uppercase tracking-widest text-neutral-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-sans text-xs text-white">{u.username}</td>
                    <td className="py-3 px-4 font-sans text-xs text-neutral-400">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-sans tracking-widest uppercase ${u.role === "ADMIN" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-neutral-400"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.email !== "swagyser9@gmail.com" && (
                        <button 
                          onClick={() => handleToggleRole(u.id, u.role)}
                          className="font-sans text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
                        >
                          Make {u.role === "ADMIN" ? "USER" : "ADMIN"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-neutral-500 text-xs italic font-serif">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
