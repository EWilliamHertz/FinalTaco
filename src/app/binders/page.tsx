"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/store";
import { Plus, X, Book, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

export default function BindersPage() {
  const activeGame = useGameStore(state => state.activeGame);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"deck" | "binder">("deck");
  const [game, setGame] = useState<"pokemon" | "mtg">(activeGame === "pokemon" ? "pokemon" : "mtg");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    // Simulate creation
    toast.success(`${type === 'deck' ? 'Deck' : 'Binder'} "${name}" created successfully!`);
    setIsModalOpen(false);
    setName("");
    setDescription("");
  };

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 lg:px-12 max-w-[1400px] mx-auto relative">
      <div className="mb-16 border-b border-white/10 pb-8 flex justify-between items-end">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl text-white font-light uppercase tracking-widest mb-3">
            My <span className="text-purple-400">Decks & Binders</span>
          </h1>
          <p className="font-sans text-neutral-400 text-sm tracking-[0.2em] uppercase">
            Construct and organize your vault
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-white text-black hover:bg-neutral-200 transition-colors rounded-lg font-sans text-[10px] uppercase tracking-widest"
        >
          <Plus size={14} /> Create New
        </button>
      </div>

      <div className="py-20 text-center flex flex-col items-center justify-center opacity-50 border border-dashed border-white/10 rounded-2xl">
        <p className="font-serif text-2xl text-neutral-400 mb-2">No Binders Found</p>
        <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-6 max-w-md leading-relaxed">
          Create a new deck or custom binder to organize your {activeGame === "pokemon" ? "Pokémon" : activeGame === "mtg" ? "Magic" : "cards"} into playable sets or showcase folios.
        </p>
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-2xl p-6 lg:p-8 shadow-2xl"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-neutral-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <h2 className="font-serif text-2xl text-white mb-2">Create New Collection</h2>
              <p className="font-sans text-xs text-neutral-400 tracking-widest uppercase mb-8">
                Organize your vault for battle or display
              </p>

              <form onSubmit={handleCreate} className="space-y-6">
                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setType("deck")}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                      type === "deck" 
                        ? "border-purple-500 bg-purple-500/10 text-purple-400" 
                        : "border-white/10 text-neutral-400 hover:border-white/30"
                    }`}
                  >
                    <Book size={24} className="mb-2" />
                    <span className="font-sans text-[10px] uppercase tracking-widest">Deck</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("binder")}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                      type === "binder" 
                        ? "border-purple-500 bg-purple-500/10 text-purple-400" 
                        : "border-white/10 text-neutral-400 hover:border-white/30"
                    }`}
                  >
                    <LayoutDashboard size={24} className="mb-2" />
                    <span className="font-sans text-[10px] uppercase tracking-widest">Binder</span>
                  </button>
                </div>

                {/* Game Selection */}
                <div className="space-y-2">
                  <label className="font-sans text-[10px] uppercase tracking-widest text-neutral-500">Game System</label>
                  <div className="flex gap-2 p-1 bg-black/50 rounded-lg border border-white/5">
                    <button
                      type="button"
                      onClick={() => setGame("mtg")}
                      className={`flex-1 py-2 rounded-md font-sans text-[10px] uppercase tracking-widest transition-all ${
                        game === "mtg" ? "bg-white/10 text-orange-400" : "text-neutral-500 hover:text-white"
                      }`}
                    >
                      Magic
                    </button>
                    <button
                      type="button"
                      onClick={() => setGame("pokemon")}
                      className={`flex-1 py-2 rounded-md font-sans text-[10px] uppercase tracking-widest transition-all ${
                        game === "pokemon" ? "bg-white/10 text-yellow-400" : "text-neutral-500 hover:text-white"
                      }`}
                    >
                      Pokémon
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-sans text-[10px] uppercase tracking-widest text-neutral-500">Name</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 focus:border-purple-500 rounded-lg px-4 py-3 text-white font-sans text-sm focus:outline-none transition-colors"
                    placeholder={`e.g. ${game === 'mtg' ? 'Modern Burn' : 'Charizard Collection'}`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-sans text-[10px] uppercase tracking-widest text-neutral-500">Description (Optional)</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-black/50 border border-white/10 focus:border-purple-500 rounded-lg px-4 py-3 text-white font-sans text-sm focus:outline-none transition-colors resize-none"
                    placeholder="What's this collection for?"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={!name}
                  className="w-full py-4 bg-white text-black disabled:bg-white/20 disabled:text-white/40 hover:bg-neutral-200 transition-colors rounded-lg font-sans text-xs uppercase tracking-widest mt-4"
                >
                  Create {type}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
