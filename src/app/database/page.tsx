"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useGameStore } from "@/lib/store";
import { fetchGroups, CATEGORY_IDS } from "@/lib/tcgcsv";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function DatabasePage() {
  const activeGame = useGameStore((state) => state.activeGame);
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "sealed">("cards");

  useEffect(() => {
    if (!activeGame) {
      router.push("/");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      if (activeGame === "both") {
        const [pokemonData, mtgData] = await Promise.all([
          fetchGroups(CATEGORY_IDS.pokemon),
          fetchGroups(CATEGORY_IDS.mtg)
        ]);
        setGroups([...pokemonData, ...mtgData]);
      } else {
        const catId = activeGame === "pokemon" ? CATEGORY_IDS.pokemon : CATEGORY_IDS.mtg;
        const data = await fetchGroups(catId);
        setGroups(data);
      }
      setLoading(false);
    };

    loadData();
  }, [activeGame, router]);

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
  const brandColor = activeGame === "pokemon" ? "text-yellow-400" : "text-orange-500";
  const brandBorder = activeGame === "pokemon" ? "focus:border-yellow-400" : "focus:border-orange-500";

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 lg:px-12 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 border-b border-white/10 pb-8">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl text-white font-light uppercase tracking-widest mb-3">
            Card <span className={brandColor}>Database</span>
          </h1>
          <p className="font-sans text-neutral-400 text-sm tracking-[0.2em] uppercase">
            {activeGame === "both" ? "Pokémon & MTG Sets" : activeGame === "pokemon" ? "Pokémon TCG Sets" : "Magic: The Gathering Sets"}
          </p>
        </div>

        <div className="relative flex flex-col items-end gap-4">
          <div className="flex items-center gap-4 border border-white/10 p-1 rounded-lg bg-neutral-900/50">
            <button 
              onClick={() => setViewMode("cards")}
              className={`px-4 py-2 rounded font-sans text-[10px] uppercase tracking-widest transition-colors ${viewMode === "cards" ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}
            >
              Sets
            </button>
            <button 
              onClick={() => setViewMode("sealed")}
              className={`px-4 py-2 rounded font-sans text-[10px] uppercase tracking-widest transition-colors ${viewMode === "sealed" ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}
            >
              Sealed Product
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input 
              type="text" 
              placeholder={viewMode === "cards" ? "Search sets..." : "Search sealed products..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`bg-transparent border-b border-white/20 pl-10 pr-4 py-2 text-sm text-white focus:outline-none transition-colors w-64 md:w-80 font-serif italic ${brandBorder}`}
            />
          </div>
        </div>
      </div>

      {viewMode === "sealed" ? (
        <div className="text-center text-neutral-500 font-serif italic py-12">Sealed Database coming soon...</div>
      ) : loading ? (
        <div className="text-center text-neutral-500 font-serif italic">Consulting the archives...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGroups.map((group, i) => {
            const catId = activeGame === "pokemon" ? CATEGORY_IDS.pokemon : CATEGORY_IDS.mtg;
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i % 20) * 0.05, duration: 0.4 }}
                key={group.groupId}
                onClick={() => router.push(`/database/${catId}/${group.groupId}`)}
                className="p-6 border border-white/5 bg-neutral-900/30 hover:bg-neutral-900/80 hover:border-white/20 transition-all rounded-xl cursor-pointer group"
              >
                <h3 className="font-serif text-lg text-white group-hover:text-white mb-2">{group.name}</h3>
                <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500">
                  Released: {new Date(group.publishedOn).toLocaleDateString()}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </main>
  );
}
