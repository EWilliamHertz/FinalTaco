"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/store";
import { motion } from "framer-motion";
import { TrendingUp, Plus, Grid, Search } from "lucide-react";
import { getVault } from "@/app/actions/vault";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CollectionPage() {
  const activeGame = useGameStore((state) => state.activeGame);
  const router = useRouter();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"cards" | "sealed">("cards");
  
  useEffect(() => {
    if (!activeGame) {
      router.push("/");
      return;
    }

    const load = async () => {
      const res = await getVault();
      if (res.success && res.instances) {
        setCards(res.instances);
      }
      setLoading(false);
    };
    load();
  }, [activeGame, router]);

  const brandColor = activeGame === "pokemon" ? "text-yellow-400" : activeGame === "mtg" ? "text-orange-500" : "text-emerald-400";
  const brandBorder = activeGame === "pokemon" ? "border-yellow-400" : activeGame === "mtg" ? "border-orange-500" : "border-emerald-400";
  const brandBg = activeGame === "pokemon" ? "bg-yellow-400" : activeGame === "mtg" ? "bg-orange-500" : "bg-emerald-400";

  // Filter cards by active game (if not 'both')
  const displayedCards = activeGame === "both" 
    ? cards 
    : cards.filter(c => c.Card.game.toLowerCase() === activeGame);

  const totalValue = displayedCards.reduce((acc, curr) => acc + (curr.Card.marketPrice || 0), 0);

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 lg:px-12 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 border-b border-white/10 pb-8">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl text-white font-light uppercase tracking-widest mb-3">
            Your <span className={brandColor}>Vault</span>
          </h1>
          <p className="font-sans text-neutral-400 text-sm tracking-[0.2em] uppercase">
            Collection & Portfolio Growth
          </p>
        </div>

        <div className="flex gap-12 font-serif">
          <div className="flex flex-col">
            <span className="text-3xl text-white">{displayedCards.length}</span>
            <span className="text-xs text-neutral-500 uppercase tracking-widest font-sans">Cards</span>
          </div>
          <div className="flex flex-col">
            <span className={`text-3xl ${brandColor}`}>${totalValue.toFixed(2)}</span>
            <span className="text-xs text-neutral-500 uppercase tracking-widest font-sans">Est. Value</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Collection Grid */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 border border-white/10 p-1 rounded-lg bg-neutral-900/50">
              <button 
                onClick={() => setViewMode("cards")}
                className={`px-4 py-2 rounded font-sans text-[10px] uppercase tracking-widest transition-colors ${viewMode === "cards" ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}
              >
                Cards
              </button>
              <button 
                onClick={() => setViewMode("sealed")}
                className={`px-4 py-2 rounded font-sans text-[10px] uppercase tracking-widest transition-colors ${viewMode === "sealed" ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}
              >
                Sealed Product
              </button>
            </div>
            <button onClick={() => useGameStore.getState().setSearchOpen(true, "cards")} className={`text-[10px] uppercase tracking-widest ${brandColor} hover:text-white transition-colors flex items-center gap-1`}>
              <Search size={12} /> Search to Add
            </button>
          </div>

          {viewMode === "sealed" ? (
            <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center">
              <p className="font-serif text-white text-lg mb-2">No Sealed Products</p>
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-neutral-500">You don't have any sealed boxes in your vault yet.</p>
            </div>
          ) : loading ? (
            <div className="text-neutral-500 font-serif italic py-12 text-center">Unlocking vault...</div>
          ) : displayedCards.length === 0 ? (
            <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center text-neutral-600 mb-4">
                <Plus size={24} />
              </div>
              <p className="font-serif text-white text-lg mb-2">Your vault is empty</p>
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-6">Start building your collection</p>
              <button onClick={() => useGameStore.getState().setSearchOpen(true, "cards")} className={`px-6 py-3 border ${brandBorder} text-white hover:${brandBg} hover:text-black transition-colors rounded-full font-sans text-[10px] uppercase tracking-widest`}>
                Search Cards
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedCards.map((instance, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i % 20) * 0.05, duration: 0.4 }}
                  key={instance.id}
                  className="group relative flex flex-col gap-2 p-3 bg-neutral-900/40 border border-white/5 rounded-xl hover:bg-neutral-900 transition-colors"
                >
                  <div className="relative aspect-[63/88] rounded-lg overflow-hidden bg-black">
                    {instance.Card.imageUrl ? (
                      <Image src={instance.Card.imageUrl} alt={instance.Card.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-neutral-800 font-serif text-xs">No Image</div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[8px] font-sans uppercase tracking-widest text-white border border-white/10">
                      {instance.condition.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="mt-1">
                    <h3 className="font-serif text-sm text-white truncate">{instance.Card.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <p className="font-sans text-[9px] uppercase tracking-widest text-neutral-500 truncate mr-2">
                        {instance.Card.setName}
                      </p>
                      {instance.Card.marketPrice > 0 && (
                        <p className={`font-serif text-xs ${brandColor}`}>${instance.Card.marketPrice.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-6">
          <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px]">
            <TrendingUp className={`w-12 h-12 ${brandColor} mb-4 opacity-50`} />
            <p className="font-serif text-neutral-400 italic text-lg mb-2 text-center">Market Pulse</p>
            <p className="font-sans text-[9px] text-center uppercase tracking-[0.2em] text-neutral-500">Analytics unlock at 50 cards</p>
          </div>

          <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-6">
            <h3 className="font-sans text-xs uppercase tracking-widest text-neutral-500 mb-4 pb-2 border-b border-white/10">Recent Additions</h3>
            <div className="space-y-4">
              {displayedCards.slice(0, 4).map((instance) => (
                <div key={instance.id} className="flex items-center gap-3">
                  <div className="w-10 h-14 bg-black rounded shrink-0 relative overflow-hidden border border-white/10">
                    {instance.Card.imageUrl && <Image src={instance.Card.imageUrl} alt={instance.Card.name} fill className="object-cover" unoptimized />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-serif text-white text-xs truncate">{instance.Card.name}</h4>
                    <p className={`font-serif text-[10px] ${brandColor}`}>${instance.Card.marketPrice?.toFixed(2) || "0.00"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
