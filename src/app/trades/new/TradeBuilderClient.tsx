"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getVault } from "@/app/actions/vault";
import { getUserVault } from "@/app/actions/user";
import { getUserProfile } from "@/app/actions/user";
import { createTrade } from "@/app/actions/trade";
import Image from "next/image";
import { proxiedImage } from "@/lib/images";
import { Search, LayoutGrid, List as ListIcon, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

export function TradeBuilderClient({ currentUser }: { currentUser: any }) {
  const router = useRouter();
  const [targetUsername, setTargetUsername] = useState("");
  const [targetUser, setTargetUser] = useState<any>(null);
  
  const [myVault, setMyVault] = useState<any[]>([]);
  const [theirVault, setTheirVault] = useState<any[]>([]);
  
  const [loadingUser, setLoadingUser] = useState(false);
  
  const [offeredIds, setOfferedIds] = useState<Set<string>>(new Set());
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"NAME_ASC" | "NAME_DESC" | "PRICE_DESC">("NAME_ASC");
  
  const [submitting, setSubmitting] = useState(false);

  const handleLoadUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername.trim()) return;
    
    setLoadingUser(true);
    try {
      const profileRes = await getUserProfile(targetUsername);
      if (!profileRes) {
        toast.error("User not found");
        setLoadingUser(false);
        return;
      }
      
      const targetVaultRes = await getUserVault(targetUsername);
      const myVaultRes = await getVault();
      
      if (Array.isArray(targetVaultRes) && myVaultRes.success) {
        setTargetUser(profileRes);
        setTheirVault(targetVaultRes);
        setMyVault(myVaultRes.instances || []);
        setOfferedIds(new Set());
        setRequestedIds(new Set());
      } else {
        toast.error("Failed to load vaults");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
    setLoadingUser(false);
  };

  const getFilteredSorted = (vault: any[]) => {
    let result = vault.filter(v => 
      v.Card.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (v.Card.setName && v.Card.setName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    result = result.sort((a, b) => {
      const valA = a.customPrice || a.Card.marketPrice || 0;
      const valB = b.customPrice || b.Card.marketPrice || 0;
      
      if (sortBy === "PRICE_DESC") return valB - valA;
      if (sortBy === "NAME_ASC") return a.Card.name.localeCompare(b.Card.name);
      if (sortBy === "NAME_DESC") return b.Card.name.localeCompare(a.Card.name);
      return 0;
    });

    return result;
  };

  const filteredMyVault = useMemo(() => getFilteredSorted(myVault), [myVault, searchQuery, sortBy]);
  const filteredTheirVault = useMemo(() => getFilteredSorted(theirVault), [theirVault, searchQuery, sortBy]);

  const toggleOffered = (id: string) => {
    setOfferedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleRequested = (id: string) => {
    setRequestedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmitTrade = async () => {
    if (offeredIds.size === 0 && requestedIds.size === 0) {
      toast.error("Trade is empty");
      return;
    }
    setSubmitting(true);
    const res = await createTrade(
      targetUser.id, 
      Array.from(offeredIds), 
      Array.from(requestedIds)
    );
    
    if (res.success) {
      toast.success("Trade proposed!");
      router.push("/trades");
    } else {
      toast.error(res.error || "Failed to propose trade");
      setSubmitting(false);
    }
  };

  if (!targetUser) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <h2 className="font-serif text-2xl text-white mb-6">Select Trading Partner</h2>
        <form onSubmit={handleLoadUser} className="flex gap-4">
          <input 
            type="text" 
            placeholder="Username..." 
            value={targetUsername}
            onChange={(e) => setTargetUsername(e.target.value)}
            className="flex-1 bg-neutral-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 font-serif"
          />
          <button 
            type="submit" 
            disabled={loadingUser}
            className="px-6 py-3 bg-white text-black hover:bg-neutral-200 transition-colors rounded-lg font-sans text-xs uppercase tracking-widest disabled:opacity-50"
          >
            {loadingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : "Next"}
          </button>
        </form>
      </div>
    );
  }

  const renderVault = (instances: any[], isMine: boolean) => {
    const selectedSet = isMine ? offeredIds : requestedIds;
    const toggleFn = isMine ? toggleOffered : toggleRequested;

    if (viewMode === "grid") {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {instances.map(instance => (
            <div 
              key={instance.id}
              onClick={() => toggleFn(instance.id)}
              className={`relative aspect-[63/88] rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${selectedSet.has(instance.id) ? 'border-emerald-400 scale-95 opacity-100' : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'}`}
            >
              {instance.Card.imageUrl ? (
                <Image src={proxiedImage(instance.Card.imageUrl)!} alt={instance.Card.name} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-neutral-900 flex items-center justify-center p-4 text-center">
                  <span className="font-serif text-xs text-white">{instance.Card.name}</span>
                </div>
              )}
              {selectedSet.has(instance.id) && (
                <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                  <div className="bg-emerald-500 text-black px-2 py-1 rounded font-sans text-[10px] uppercase tracking-widest font-bold">
                    Selected
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md p-2">
                <p className="font-serif text-[10px] text-white truncate">{instance.Card.name}</p>
                <p className="font-serif text-[10px] text-emerald-400">$\{(instance.customPrice || instance.Card.marketPrice || 0).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {instances.map(instance => (
          <div 
            key={instance.id}
            onClick={() => toggleFn(instance.id)}
            className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${selectedSet.has(instance.id) ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-neutral-900/50 border-white/5 hover:border-white/20'}`}
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedSet.has(instance.id) ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-neutral-500'}`}>
              {selectedSet.has(instance.id) && <span className="text-[10px] font-bold">✓</span>}
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-4">
              <span className="font-serif text-white truncate w-1/3">{instance.Card.name}</span>
              <span className="font-sans text-[10px] uppercase tracking-widest text-neutral-400 w-1/4 truncate">{instance.Card.setName} ({instance.Card.setCode})</span>
              <span className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 w-1/4">#{instance.Card.number || "?"}</span>
              <span className="font-serif text-emerald-400 text-right w-20">$\{(instance.customPrice || instance.Card.marketPrice || 0).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const totalOfferedValue = Array.from(offeredIds).reduce((acc, id) => {
    const card = myVault.find(c => c.id === id);
    return acc + (card ? (card.customPrice || card.Card.marketPrice || 0) : 0);
  }, 0);

  const totalRequestedValue = Array.from(requestedIds).reduce((acc, id) => {
    const card = theirVault.find(c => c.id === id);
    return acc + (card ? (card.customPrice || card.Card.marketPrice || 0) : 0);
  }, 0);

  return (
    <div className="flex flex-col gap-8">
      {/* Controls */}
      <div className="bg-neutral-900/30 border border-white/5 p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white text-black" : "bg-black/50 text-neutral-400 hover:text-white border border-white/10"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-white text-black" : "bg-black/50 text-neutral-400 hover:text-white border border-white/10"}`}
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Filter cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white font-sans text-xs focus:outline-none focus:border-white/30"
            />
          </div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans text-[10px] uppercase tracking-widest focus:outline-none focus:border-white/30"
          >
            <option value="NAME_ASC">Name: A to Z</option>
            <option value="NAME_DESC">Name: Z to A</option>
            <option value="PRICE_DESC">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Their Offer */}
        <div>
          <div className="flex justify-between items-end mb-6 border-b border-white/5 pb-4">
            <div>
              <h2 className="font-serif text-2xl text-white mb-1">Their Offer</h2>
              <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500">Requesting from {targetUser.username}</p>
            </div>
            <div className="text-right">
              <p className="font-serif text-2xl text-emerald-400">${totalRequestedValue.toFixed(2)}</p>
              <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500">{requestedIds.size} Cards Selected</p>
            </div>
          </div>
          <div className="h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {renderVault(filteredTheirVault, false)}
          </div>
        </div>

        {/* Right Side: Your Offer */}
        <div>
          <div className="flex justify-between items-end mb-6 border-b border-white/5 pb-4">
            <div>
              <h2 className="font-serif text-2xl text-white mb-1">Your Offer</h2>
              <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500">Offering from your vault</p>
            </div>
            <div className="text-right">
              <p className="font-serif text-2xl text-emerald-400">${totalOfferedValue.toFixed(2)}</p>
              <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500">{offeredIds.size} Cards Selected</p>
            </div>
          </div>
          <div className="h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {renderVault(filteredMyVault, true)}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-8 border-t border-white/10">
        <button 
          onClick={handleSubmitTrade}
          disabled={submitting || (offeredIds.size === 0 && requestedIds.size === 0)}
          className="px-12 py-4 bg-emerald-500 text-black hover:bg-emerald-400 transition-colors rounded-lg font-sans text-xs uppercase tracking-widest font-bold disabled:opacity-50"
        >
          {submitting ? "Sending..." : "Send Trade Proposal"}
        </button>
      </div>
    </div>
  );
}
