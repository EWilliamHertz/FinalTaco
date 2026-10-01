"use client";

import { motion } from "framer-motion";
import { useGameStore, GameSelection } from "@/lib/store";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const { setActiveGame } = useGameStore();
  const router = useRouter();

  const handleSelect = (game: GameSelection) => {
    setActiveGame(game);
    router.push("/feed");
  };

  return (
    <main className="relative w-full min-h-[100dvh] flex flex-col items-center justify-between bg-[#050505] pt-16">
      {/* Background glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-white/5 rounded-full blur-[100px] mix-blend-screen animate-pulse" />
      </div>

      {/* Top Logo */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center w-full px-4 flex flex-col items-center flex-shrink-0"
      >
        <div className="relative w-full max-w-[300px] h-[120px] md:h-[150px] mx-auto mb-2">
          <Image 
            src="/hatake_logo.png" 
            alt="Hatake.Social Logo" 
            fill 
            className="object-contain" 
            unoptimized 
            priority
          />
        </div>
        <p className="font-serif text-2xl tracking-[0.3em] uppercase text-white/70 mt-2">
          Hatake.Social
        </p>
        <p className="font-sans text-[10px] md:text-xs tracking-[0.4em] uppercase text-neutral-600 mt-2">
          Select Your Realm
        </p>
      </motion.div>

      {/* Main interactive area (Cards + Button) pushed to the bottom */}
      <div className="relative z-10 w-full mt-auto flex flex-col items-center">
        {/* Cards */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-end justify-center w-full px-4 pb-6">
          {/* Pokemon Option */}
          <button
            onClick={() => handleSelect("pokemon")}
            className="group cursor-pointer w-full max-w-[320px] h-[45vh] md:h-[50vh] rounded-3xl md:rounded-b-none md:rounded-t-3xl overflow-hidden border border-white/10 md:border-b-0 hover:border-yellow-400/50 transition-all duration-300 bg-neutral-900/50 backdrop-blur-md flex flex-col relative focus:outline-none"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full h-full relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none" />
              <Image 
                src="/IMG_6315.jpeg" 
                alt="Pokemon" 
                fill 
                className="object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700 grayscale group-hover:grayscale-0 pointer-events-none" 
                unoptimized 
              />
              <div className="absolute inset-x-0 bottom-8 z-20 text-center p-6 pointer-events-none">
                <h2 className="font-serif text-3xl text-white group-hover:text-yellow-400 transition-colors">Pokémon</h2>
                <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-400 mt-2">Enter the Vault</p>
              </div>
            </motion.div>
          </button>

          {/* MTG Option */}
          <button
            onClick={() => handleSelect("mtg")}
            className="group cursor-pointer w-full max-w-[320px] h-[45vh] md:h-[50vh] rounded-3xl md:rounded-b-none md:rounded-t-3xl overflow-hidden border border-white/10 md:border-b-0 hover:border-orange-500/50 transition-all duration-300 bg-neutral-900/50 backdrop-blur-md flex flex-col relative focus:outline-none"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full h-full relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none" />
              <Image 
                src="/IMG_6316.jpeg" 
                alt="Magic The Gathering" 
                fill 
                className="object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700 grayscale group-hover:grayscale-0 pointer-events-none" 
                unoptimized 
              />
              <div className="absolute inset-x-0 bottom-8 z-20 text-center p-6 pointer-events-none">
                <h2 className="font-serif text-3xl text-white group-hover:text-orange-500 transition-colors">Magic</h2>
                <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-400 mt-2">Enter the Multiverse</p>
              </div>
            </motion.div>
          </button>
        </div>

        {/* Both Paths Button - Moved to the bottom in flow */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full text-center pb-8 pt-4 md:pb-6 md:pt-2 md:absolute md:bottom-6 md:left-0 md:right-0 z-30 pointer-events-none"
        >
          <button 
            onClick={() => handleSelect("both")}
            className="pointer-events-auto px-10 py-4 border border-white/20 text-neutral-400 hover:text-white hover:border-white hover:bg-black/80 transition-all duration-300 font-sans tracking-widest text-xs uppercase cursor-pointer backdrop-blur-md focus:outline-none rounded-full bg-black/60 shadow-xl"
          >
            I walk both paths
          </button>
        </motion.div>
      </div>
    </main>
  );
}
