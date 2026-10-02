"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { getUserVault } from "@/app/actions/user";
import { proxiedImage } from "@/lib/images";
import { MultiSelect } from "@/components/MultiSelect";
import { LayoutGrid, List } from "lucide-react";
import FoilCard from "@/components/FoilCard";

export default function ProfileVaultClient({ username }: { username: string }) {
  const [vault, setVault] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGames, setActiveGames] = useState<Set<string>>(new Set());
  const [filterConditions, setFilterConditions] = useState<Set<string>>(new Set());
  const [filterVariants, setFilterVariants] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const [sortBy, setSortBy] = useState<"NEWEST" | "PRICE_DESC" | "PRICE_ASC" | "NAME_ASC" | "NAME_DESC">("NEWEST");

  useEffect(() => {
    setLoading(true);
    getUserVault(username, undefined).then(data => {
      setVault(data);
      setLoading(false);
    });
  }, [username]);

  // Extract unique tags/notes for the filter
  const uniqueConditions = useMemo(() => {
    const conditions = new Set<string>();
    vault.forEach(instance => {
      if (instance.condition) conditions.add(instance.condition);
    });
    return Array.from(conditions).sort();
  }, [vault]);

  const uniqueVariants = useMemo(() => {
    const variants = new Set<string>();
    vault.forEach(instance => {
      if (instance.notes) {
        instance.notes.split(",").forEach((note: string) => {
          const t = note.trim();
          if (t) variants.add(t);
        });
      }
    });
    return Array.from(variants).sort();
  }, [vault]);

  const uniqueGames = useMemo(() => Array.from(new Set(vault.map((c: any) => c.Card?.game?.toUpperCase()))).filter(Boolean), [vault]);

  const filteredVault = useMemo(() => {
    let filtered = [...vault];
    if (activeGames.size > 0) {
      filtered = filtered.filter(c => activeGames.has(c.Card.game.toUpperCase()));
    }
    if (filterConditions.size > 0) {
      filtered = filtered.filter(c => c.condition && filterConditions.has(c.condition));
    }
    if (filterVariants.size > 0) {
      filtered = filtered.filter(c => {
        if (!c.notes) return false;
        const notesArr = c.notes.split(",").map((n: string) => n.trim());
        return Array.from(filterVariants).some(v => notesArr.includes(v));
      });
    }
    return filtered;
  }, [vault, activeGames, filterConditions, filterVariants]);

  
  const sortedAndFilteredVault = useMemo(() => {
    let res = [...filteredVault];
    
    const getValue = (instance: any) => {
      if (instance.customPrice && instance.customPrice > 0) return instance.customPrice;
      const isReverse = instance.notes?.includes("Reverse Holo");
      if (isReverse && instance.Card.reversePrice && instance.Card.reversePrice > 0) return instance.Card.reversePrice;
      const isFoil = instance.notes?.includes("Foil");
      if (isFoil && instance.Card.foilPrice && instance.Card.foilPrice > 0) return instance.Card.foilPrice;
      return instance.Card.marketPrice || 0;
    };

    if (sortBy === "PRICE_ASC") {
      res.sort((a, b) => getValue(a) - getValue(b));
    } else if (sortBy === "PRICE_DESC") {
      res.sort((a, b) => getValue(b) - getValue(a));
    } else if (sortBy === "NAME_ASC") {
      res.sort((a, b) => a.Card.name.localeCompare(b.Card.name));
    } else if (sortBy === "NAME_DESC") {
      res.sort((a, b) => b.Card.name.localeCompare(a.Card.name));
    }
    
    return res;
  }, [filteredVault, sortBy]);

  return (
    <div className="mt-16 border-t border-white/10 pt-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <h2 className="font-sans text-xs uppercase tracking-widest text-neutral-400">
          Public Vault
        </h2>

        <div className="flex flex-col sm:flex-row gap-4">

          {vault.length > 1 && (
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans text-[10px] uppercase tracking-widest focus:outline-none focus:border-white/30"
            >
              <option value="NEWEST">Sort: Newest</option>
              <option value="PRICE_DESC">Price: High to Low</option>
              <option value="PRICE_ASC">Price: Low to High</option>
              <option value="NAME_ASC">Name: A to Z</option>
              <option value="NAME_DESC">Name: Z to A</option>
            </select>
          )}

          
          {uniqueGames.length > 1 && (
            <MultiSelect 
              options={uniqueGames}
              selected={activeGames}
              onChange={setActiveGames}
              placeholder="All Games"
              formatOption={(g) => g === 'MTG' ? 'Magic: The Gathering' : g === 'POKEMON' ? 'Pokémon' : g}
            />
          )}


          {uniqueConditions.length > 1 && (
            <MultiSelect 
              options={uniqueConditions}
              selected={filterConditions}
              onChange={setFilterConditions}
              placeholder="All Conditions"
              formatOption={(c) => c.replace(/_/g, ' ')}
            />
          )}
          {uniqueVariants.length > 1 && (
            <MultiSelect 
              options={uniqueVariants}
              selected={filterVariants}
              onChange={setFilterVariants}
              placeholder="All Variants"
            />
          )}

          <div className="flex bg-black/50 border border-white/10 rounded-lg p-1 ml-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white"}`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white"}`}
            >
              <List size={14} />
            </button>
          </div>
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
      ) : sortedAndFilteredVault.length === 0 ? (
        <div className="py-12 text-center text-neutral-500 font-serif italic border border-white/5 rounded-xl bg-neutral-900/30">
          No cards match the selected filter.
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {sortedAndFilteredVault.map((instance) => (
            <div key={instance.id} className="group relative">
              <div className="relative aspect-[63/88] rounded-xl overflow-hidden border border-white/10 mb-3 [perspective:1000px]">
                {instance.Card.imageUrl ? (
                  <FoilCard src={proxiedImage(instance.Card.imageUrl)!} alt={instance.Card.name} isFoil={Boolean(instance.notes?.toLowerCase().match(/foil|holo/) || instance.Card.rarity?.toLowerCase().match(/mythic|holo|rare/))} />
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
      ) : (
        <div className="flex flex-col gap-2">
          {sortedAndFilteredVault.map((instance) => (
            <div key={instance.id} className="flex items-center gap-4 bg-neutral-900/40 border border-white/5 p-3 rounded-xl hover:bg-neutral-900 transition-colors">
              <div className="relative w-12 aspect-[63/88] rounded shrink-0 overflow-hidden bg-black [perspective:1000px]">
                {instance.Card.imageUrl ? (
                  <FoilCard src={proxiedImage(instance.Card.imageUrl)!} alt={instance.Card.name} isFoil={Boolean(instance.notes?.toLowerCase().match(/foil|holo/) || instance.Card.rarity?.toLowerCase().match(/mythic|holo|rare/))} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-500 font-serif text-[8px]">N/A</div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
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
              
              <div className="text-right shrink-0">
                <p className="font-serif text-white">
                  ${(instance.customPrice || instance.Card.marketPrice || 0).toFixed(2)}
                </p>
                {instance.customPrice && (
                  <span className="text-[8px] uppercase tracking-widest text-emerald-400">Custom</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
