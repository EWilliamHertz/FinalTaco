"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useGameStore } from "@/lib/store";

const links = [
  { name: "Feed", href: "/feed" },
  { name: "Database", href: "/database" },
  { name: "Market", href: "/market" },
  { name: "Collection", href: "/collection" },
];

export function Navigation() {
  const pathname = usePathname();
  const setSidebarOpen = useGameStore((state) => state.setSidebarOpen);
  const isSidebarOpen = useGameStore((state) => state.isSidebarOpen);
  const activeGame = useGameStore((state) => state.activeGame);
  const isSearchOpen = useGameStore((state) => state.isSearchOpen);
  const searchMode = useGameStore((state) => state.searchMode);
  const setIsSearchOpen = useGameStore((state) => state.setSearchOpen);
  
  const [searchName, setSearchName] = useState("");
  const [searchSet, setSearchSet] = useState("");
  const [searchNumber, setSearchNumber] = useState("");
  const [searchUser, setSearchUser] = useState("");
  
  const [user, setUser] = useState<{username: string, avatarUrl: string | null} | null>(null);

  useEffect(() => {
    import("@/app/actions/auth").then(({ getCurrentUser }) => {
      getCurrentUser().then(setUser);
    });
  }, [pathname]);

  if (!activeGame && (pathname === "/" || pathname === "/select")) return null;

  const brandColor = activeGame === "pokemon" ? "text-yellow-400" : activeGame === "mtg" ? "text-orange-500" : "text-emerald-400";
  const brandBg = activeGame === "pokemon" ? "bg-yellow-400" : activeGame === "mtg" ? "bg-orange-500" : "bg-emerald-400";

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-8 py-5 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <Link href="/select" className="flex items-center gap-2 group">
          <span className="font-serif text-2xl uppercase tracking-widest text-white group-hover:opacity-80 transition-opacity">
            Hatake.<span className={brandColor}>Social</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 font-sans text-xs uppercase tracking-[0.2em] transition-colors duration-500",
                  isActive ? brandColor : "text-neutral-500 hover:text-neutral-200"
                )}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className={cn("absolute -bottom-3 left-0 right-0 h-[1px]", brandBg)}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSearchOpen(true, "all")} className="text-neutral-500 hover:text-white transition-colors font-sans text-[10px] uppercase tracking-widest flex items-center gap-2">
            Search
          </button>
          <Link href="/settings" className="text-neutral-500 hover:text-white transition-colors">
            <Settings size={20} />
          </Link>
          <div 
            onClick={() => setSidebarOpen(true)}
            className="h-8 w-8 rounded-full border border-white/10 bg-neutral-900 overflow-hidden flex items-center justify-center cursor-pointer hover:border-white/50 transition-colors"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-neutral-500 font-serif">{user?.username ? user.username.slice(0,3).toUpperCase() : "USR"}</span>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsSearchOpen(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-4xl bg-neutral-900 border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col gap-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-serif text-2xl text-white uppercase tracking-widest">Card Search</h2>
              <button onClick={() => setIsSearchOpen(false)} className="text-neutral-500 hover:text-white">&times;</button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              // Build search query and redirect to results page
              const queryParams = new URLSearchParams();
              if (searchName) queryParams.set('name', searchName);
              if (searchSet) queryParams.set('set', searchSet);
              if (searchNumber) queryParams.set('number', searchNumber);
              
              window.location.href = `/search?${queryParams.toString()}`;
            }} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Card Name</label>
                <input 
                  type="text" 
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="e.g. Charizard or Fire // Ice"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors font-serif"
                />
              </div>
              <div className="w-full md:w-32">
                <label className="block font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Set Code</label>
                <input 
                  type="text" 
                  value={searchSet}
                  onChange={(e) => setSearchSet(e.target.value)}
                  placeholder="e.g. PAF"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors font-serif"
                />
              </div>
              <div className="w-full md:w-32">
                <label className="block font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Collector #</label>
                <input 
                  type="text" 
                  value={searchNumber}
                  onChange={(e) => setSearchNumber(e.target.value)}
                  placeholder="e.g. 234"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors font-serif"
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className={`px-8 py-3 bg-white text-black hover:bg-neutral-200 transition-colors rounded-lg font-sans text-xs uppercase tracking-widest h-[46px]`}>
                  Search
                </button>
              </div>
            </form>

            <hr className="border-white/10 my-2" />
            
            {searchMode === "all" && (
              <>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-serif text-2xl text-white uppercase tracking-widest">User Search</h2>
                </div>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (searchUser) {
                    window.location.href = `/search?user=${encodeURIComponent(searchUser)}`;
                  }
                }} className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Username</label>
                    <input 
                      type="text" 
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      placeholder="e.g. LegendaryCollector"
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors font-serif"
                    />
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className={`px-8 py-3 border border-white/20 hover:border-white text-white hover:bg-white hover:text-black transition-colors rounded-lg font-sans text-xs uppercase tracking-widest h-[46px]`}>
                      Find User
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: isSidebarOpen ? "0%" : "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-[350px] bg-[#0a0a0a] border-l border-white/5 z-50 flex flex-col shadow-2xl"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full border border-white/20 bg-neutral-900 flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-neutral-400 font-serif">{user?.username ? user.username.slice(0,3).toUpperCase() : "USR"}</span>
              )}
            </div>
            <div>
              <p className="font-serif text-lg text-white">{user?.username || "Collector"}</p>
              <p className="font-sans text-[10px] uppercase tracking-widest text-emerald-500">Verified Vault</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-neutral-500 hover:text-white text-xl">&times;</button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto flex flex-col gap-8">
          <div>
            <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-4">Vault Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Total Value</p>
                <p className="font-serif text-xl text-white">$42,500</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Items</p>
                <p className="font-serif text-xl text-white">143</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-4">Quick Links</h3>
            <div className="flex flex-col gap-2 font-serif text-neutral-300">
              <Link href="/collection" onClick={() => setSidebarOpen(false)} className="p-3 hover:bg-white/5 rounded-lg transition-colors">My Collection</Link>
              <Link href="/market" onClick={() => setSidebarOpen(false)} className="p-3 hover:bg-white/5 rounded-lg transition-colors">My Listings</Link>
              <Link href="/settings" onClick={() => setSidebarOpen(false)} className="p-3 hover:bg-white/5 rounded-lg transition-colors">Account Settings</Link>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-white/5">
          <button 
            onClick={() => {
              // TODO: Implement actual signout
              setSidebarOpen(false);
            }} 
            className="w-full py-3 border border-white/10 text-neutral-400 font-sans text-xs uppercase tracking-widest hover:bg-white/5 hover:text-white transition-colors rounded-lg"
          >
            Sign Out
          </button>
        </div>
      </motion.div>
    </>
  );
}
