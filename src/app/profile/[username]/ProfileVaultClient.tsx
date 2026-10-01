"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { getUserVault } from "@/app/actions/user";

export default function ProfileVaultClient({ username }: { username: string }) {
  const [vault, setVault] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<"ALL" | "POKEMON" | "MTG">("ALL");
  const [activeTag, setActiveTag] = useState<string>("ALL");

  useEffect(() => {
    setLoading(true);
    getUserVault(username, activeGame === "ALL" ? undefined : activeGame).then(data => {
      setVault(data);
      setLoading(false);
    });
  }, [username, activeGame]);

  // Extract unique tags/notes for the filter
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    vault.forEach(instance => {
      if (instance.notes) {
        instance.notes.split(",").forEach((note: string) => {
          const t = note.trim();
          if (t) tags.add(t);
        });
      }
      if (instance.condition) {
        tags.add(instance.condition);
      }
    });
    return Array.from(tags).sort();
  }, [vault]);

  const filteredVault = useMemo(() => {
    if (activeTag === "ALL") return vault;
    return vault.filter(instance => {
      const notes = instance.notes ? instance.notes.toLowerCase() : "";
      const cond = instance.condition ? instance.condition.toLowerCase() : "";
      const tagLower = activeTag.toLowerCase();
      return notes.includes(tagLower) || cond === tagLower;
    });
  }, [vault, activeTag]);

  return (
    <div className="mt-16 border-t border-white/10 pt-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <h2 className="font-sans text-xs uppercase tracking-widest text-neutral-400">
          Public Vault
        </h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <select 
            value={activeGame}
            onChange={(e) => setActiveGame(e.target.value as any)}
            className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans text-[10px] uppercase tracking-widest focus:outline-none focus:border-white/30"
          >
            <option value="ALL">All Games</option>
            <option value="MTG">Magic: The Gathering</option>
            <option value="POKEMON">Pokémon</option>
          </select>

          {uniqueTags.length > 0 && (
            <select 
              value={activeTag}
              onChange={(e) => setActiveTag(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans text-[10px] uppercase tracking-widest focus:outline-none focus:border-white/30"
            >
              <option value="ALL">All Variants & Conditions</option>
              {uniqueTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-neutral-500 font-serif italic border border-white/5 rounded-xl bg-neutral-900/30">
          Loading vault...
        </div>
      ) : vault.length === 0 ? (
        <div className="py-12 text-center text-neutral-500 font-serif italic border border-white/5 rounded-xl bg-neutral-900/30">
          No cards found in this vault.
        </div>
      ) : filteredVault.length === 0 ? (
        <div className="py-12 text-center text-neutral-500 font-serif italic border border-white/5 rounded-xl bg-neutral-900/30">
          No cards match the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredVault.map((instance) => (
            <div key={instance.id} className="group relative">
              <div className="relative aspect-[63/88] rounded-xl overflow-hidden border border-white/10 mb-3">
                {instance.Card.imageUrl ? (
                  <Image src={instance.Card.imageUrl} alt={instance.Card.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-500 font-serif text-xs">No Image</div>
                )}
              </div>
              <h3 className="font-serif text-white text-sm truncate">{instance.Card.name}</h3>
              <p className="font-sans text-[9px] uppercase tracking-widest text-neutral-500 truncate mb-1">
                {instance.Card.setName}
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[8px] uppercase font-sans tracking-widest">
                  {instance.condition.replace('_', ' ')}
                </span>
                {instance.notes && instance.notes.split(",").map((n: string, i: number) => {
                  const t = n.trim();
                  if (!t) return null;
                  return (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] uppercase font-sans tracking-widest">
                      {t}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
