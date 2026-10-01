"use client";

import { useGameStore } from "@/lib/store";
import { Plus } from "lucide-react";

export default function BindersPage() {
  const activeGame = useGameStore(state => state.activeGame);
  
  return (
    <main className="min-h-screen pt-32 pb-20 px-6 lg:px-12 max-w-[1400px] mx-auto">
      <div className="mb-16 border-b border-white/10 pb-8 flex justify-between items-end">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl text-white font-light uppercase tracking-widest mb-3">
            My <span className="text-purple-400">Decks & Binders</span>
          </h1>
          <p className="font-sans text-neutral-400 text-sm tracking-[0.2em] uppercase">
            Construct and organize your vault
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-3 bg-white text-black hover:bg-neutral-200 transition-colors rounded-lg font-sans text-[10px] uppercase tracking-widest">
          <Plus size={14} /> Create New
        </button>
      </div>

      <div className="py-20 text-center flex flex-col items-center justify-center opacity-50 border border-dashed border-white/10 rounded-2xl">
        <p className="font-serif text-2xl text-neutral-400 mb-2">No Binders Found</p>
        <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-6 max-w-md leading-relaxed">
          Create a new deck or custom binder to organize your {activeGame === "pokemon" ? "Pokémon" : activeGame === "mtg" ? "Magic" : "cards"} into playable sets or showcase folios.
        </p>
      </div>
    </main>
  );
}
