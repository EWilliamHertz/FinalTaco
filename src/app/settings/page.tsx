"use client";

import { useGameStore, GameSelection } from "@/lib/store";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { activeGame, setActiveGame } = useGameStore();
  const router = useRouter();

  const handleToggle = (game: GameSelection) => {
    setActiveGame(game);
    router.push("/feed");
  };

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto flex flex-col items-center justify-center">
      <h1 className="font-serif text-4xl text-white mb-12">Settings</h1>
      
      <div className="w-full bg-neutral-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
        <h2 className="font-sans text-sm tracking-[0.2em] uppercase text-neutral-500 mb-6 border-b border-white/10 pb-4">
          Active Realm
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
          <button
            onClick={() => handleToggle("pokemon")}
            className={`flex-1 w-full py-8 px-6 rounded-xl border transition-all duration-300 font-serif text-2xl ${
              activeGame === "pokemon" 
                ? "border-yellow-400 bg-yellow-400/10 text-yellow-400" 
                : "border-white/10 hover:border-yellow-400/50 text-white"
            }`}
          >
            Pokémon
          </button>
          
          <button
            onClick={() => handleToggle("mtg")}
            className={`flex-1 w-full py-8 px-6 rounded-xl border transition-all duration-300 font-serif text-2xl ${
              activeGame === "mtg" 
                ? "border-orange-500 bg-orange-500/10 text-orange-500" 
                : "border-white/10 hover:border-orange-500/50 text-white"
            }`}
          >
            Magic
          </button>

          <button
            onClick={() => handleToggle("both")}
            className={`flex-1 w-full py-8 px-6 rounded-xl border transition-all duration-300 font-serif text-2xl ${
              activeGame === "both" 
                ? "border-emerald-400 bg-emerald-400/10 text-emerald-400" 
                : "border-white/10 hover:border-emerald-400/50 text-white"
            }`}
          >
            Both Paths
          </button>
        </div>
      </div>
    </main>
  );
}
