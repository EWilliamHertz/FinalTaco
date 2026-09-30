"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Heart, MessageCircle, Share2, Plus, Image as ImageIcon } from "lucide-react";
import { useGameStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { getPosts, createPost } from "@/app/actions/post";

export default function FeedPage() {
  const activeGame = useGameStore((state) => state.activeGame);
  const router = useRouter();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!activeGame) router.push("/");
  }, [activeGame, router]);

  useEffect(() => {
    getPosts().then(data => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

  if (!activeGame) return null;

  const brandColor = activeGame === "pokemon" ? "text-yellow-400" : activeGame === "mtg" ? "text-orange-500" : "text-emerald-400";
  const hoverBorder = activeGame === "pokemon" ? "hover:border-yellow-400/30" : activeGame === "mtg" ? "hover:border-orange-500/30" : "hover:border-emerald-400/30";
  const hoverText = activeGame === "pokemon" ? "hover:text-yellow-400" : activeGame === "mtg" ? "hover:text-orange-500" : "hover:text-emerald-400";
  const buttonBg = activeGame === "pokemon" ? "bg-yellow-400 text-black hover:bg-yellow-300" : activeGame === "mtg" ? "bg-orange-500 text-black hover:bg-orange-400" : "bg-emerald-400 text-black hover:bg-emerald-300";

  async function handlePost(formData: FormData) {
    formData.append("game", activeGame!);
    setIsPosting(true);
    const res = await createPost(formData);
    if (res.success) {
      formRef.current?.reset();
      const updated = await getPosts();
      setPosts(updated);
    } else {
      alert(res.error);
    }
    setIsPosting(false);
  }

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

      <div className="max-w-2xl mx-auto mb-16">
        <form ref={formRef} action={handlePost} className="bg-neutral-900/50 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
          <textarea 
            name="content"
            placeholder="Share a pull, a deck, or a thought..."
            className="w-full bg-transparent text-white font-serif resize-none focus:outline-none placeholder:text-neutral-600 mb-4"
            rows={3}
            required
          />
          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <div className="flex gap-2">
              <label className="cursor-pointer text-neutral-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
                <ImageIcon size={18} />
                <input type="text" name="image" placeholder="Image URL (optional)" className="hidden" />
              </label>
              <input type="text" name="image" placeholder="Image URL (optional)" className="bg-black/50 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none font-sans" />
            </div>
            <button 
              type="submit" 
              disabled={isPosting}
              className={`px-6 py-2 rounded-full font-sans text-xs uppercase tracking-widest transition-colors flex items-center gap-2 ${buttonBg} disabled:opacity-50`}
            >
              <Plus size={14} /> {isPosting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>

      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {loading ? (
          <div className="col-span-full py-20 text-center font-serif text-neutral-500 italic">Loading feed...</div>
        ) : posts.length === 0 ? (
          <div className="col-span-full py-32 text-center flex flex-col items-center justify-center opacity-50">
            <p className="font-serif text-3xl text-neutral-400 mb-3">The Feed is Empty</p>
            <p className="font-sans text-xs uppercase tracking-widest text-neutral-500">Be the first to post.</p>
          </div>
        ) : (
          posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
              className={`break-inside-avoid relative group rounded-2xl overflow-hidden bg-neutral-900/50 border border-white/5 ${hoverBorder} transition-colors duration-500 cursor-pointer backdrop-blur-sm`}
            >
              <div className="p-5 border-b border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-neutral-800 flex items-center justify-center">
                  {post.Author.avatarUrl ? (
                    <img src={post.Author.avatarUrl} alt={post.Author.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-neutral-400 font-serif">{post.Author.username.slice(0,3).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <span className="font-sans text-xs text-white font-medium uppercase tracking-widest">{post.Author.username}</span>
                  <span className="block font-serif text-[10px] text-neutral-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {post.images && post.images.length > 0 && (
                <div className="relative">
                  <Image
                    src={post.images[0]}
                    alt={`Post by ${post.Author.username}`}
                    width={600}
                    height={800}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    unoptimized
                  />
                </div>
              )}
              
              <div className="p-5">
                <p className="font-serif text-neutral-300 text-sm mb-4">
                  {post.content}
                </p>
                
                <div className="flex items-center gap-4 text-neutral-400">
                  <button className={`flex items-center gap-1.5 ${hoverText} transition-colors`}>
                    <Heart size={18} strokeWidth={1.5} />
                    <span className="text-xs">{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                    <MessageCircle size={18} strokeWidth={1.5} />
                    <span className="text-xs">0</span>
                  </button>
                  <button className="ml-auto hover:text-white transition-colors">
                    <Share2 size={18} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </main>
  );
}
