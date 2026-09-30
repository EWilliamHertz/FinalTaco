"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useGameStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const generateFeed = (game: string | null): any[] => {
  return []; // Placeholder data removed
};

export default function FeedPage() {
  const activeGame = useGameStore((state) => state.activeGame);
  const router = useRouter();

  useEffect(() => {
    if (!activeGame) router.push("/");
  }, [activeGame, router]);

  if (!activeGame) return null;

  const DUMMY_POSTS = generateFeed(activeGame);
  const brandColor = activeGame === "pokemon" ? "text-yellow-400" : activeGame === "mtg" ? "text-orange-500" : "text-emerald-400";
  const hoverBorder = activeGame === "pokemon" ? "hover:border-yellow-400/30" : activeGame === "mtg" ? "hover:border-orange-500/30" : "hover:border-emerald-400/30";
  const hoverText = activeGame === "pokemon" ? "hover:text-yellow-400" : activeGame === "mtg" ? "hover:text-orange-500" : "hover:text-emerald-400";

  return (
    <main className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
      <div className="mb-12 flex flex-col items-center justify-center space-y-4">
        <h1 className="font-serif text-4xl md:text-5xl text-white font-light uppercase tracking-widest">
          The <span className={brandColor}>Feed</span>
        </h1>
        <p className="font-sans text-neutral-400 text-sm tracking-[0.2em] uppercase">
          Discover {activeGame === "pokemon" ? "Pokémon" : "MTG"} Collections
        </p>
      </div>

      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {DUMMY_POSTS.length === 0 ? (
          <div className="col-span-full py-32 text-center flex flex-col items-center justify-center opacity-50">
            <p className="font-serif text-3xl text-neutral-400 mb-3">The Feed is Empty</p>
            <p className="font-sans text-xs uppercase tracking-widest text-neutral-500">Awaiting your first post.</p>
          </div>
        ) : (
          DUMMY_POSTS.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
              className={`break-inside-avoid relative group rounded-2xl overflow-hidden bg-neutral-900/50 border border-white/5 ${hoverBorder} transition-colors duration-500 cursor-pointer backdrop-blur-sm`}
            >
              <div className="relative">
                <Image
                  src={post.image}
                  alt={`Post by ${post.user}`}
                  width={600}
                  height={800}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700 ease-out grayscale group-hover:grayscale-0"
                  unoptimized
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                      <Image src={post.avatar} alt={post.user} width={32} height={32} unoptimized />
                    </div>
                    <span className="font-sans text-sm text-white font-medium">{post.user}</span>
                  </div>
                  
                  <p className="font-serif text-neutral-300 text-sm line-clamp-2 mb-4">
                    {post.caption}
                  </p>
                  
                  <div className="flex items-center gap-4 text-neutral-400">
                    <button className={`flex items-center gap-1.5 ${hoverText} transition-colors`}>
                      <Heart size={18} strokeWidth={1.5} />
                      <span className="text-xs">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                      <MessageCircle size={18} strokeWidth={1.5} />
                      <span className="text-xs">{post.comments}</span>
                    </button>
                    <button className="ml-auto hover:text-white transition-colors">
                      <Share2 size={18} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </main>
  );
}
