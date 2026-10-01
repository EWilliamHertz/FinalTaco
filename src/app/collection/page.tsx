"use client";

import { useEffect, useState, useMemo } from "react";
import { useGameStore } from "@/lib/store";
import { motion } from "framer-motion";
import { TrendingUp, Lock, Plus, Search, Check, X, Tag, DollarSign, Trash2 } from "lucide-react";
import { getVault, removeFromVault } from "@/app/actions/vault";
import { MultiSelect } from "@/components/MultiSelect";
import { toast } from "react-toastify";
import { markForSale, type ListingOverride } from "@/app/actions/market";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { proxiedImage } from "@/lib/images";

interface VaultCard {
  id: string;
  condition: string;
  notes: string | null;
  customPrice: number | null;
  Card: {
    id: string;
    name: string;
    game: string;
    setName: string;
    setCode: string | null;
    number: string | null;
    imageUrl: string | null;
    rarity: string | null;
    marketPrice: number;
    foilPrice: number | null;
    reversePrice: number | null;
  };
  Listings: { id: string; price: number }[];
}

interface PricingState {
  mode: "default" | "percent" | "flat";
  value: string;
  skip: boolean;
}

export default function CollectionPage() {
  const activeGame = useGameStore((state) => state.activeGame);
  const router = useRouter();
  const [cards, setCards] = useState<VaultCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGames, setFilterGames] = useState<Set<string>>(new Set());
  const [filterConditions, setFilterConditions] = useState<Set<string>>(new Set());
  const [filterVariants, setFilterVariants] = useState<Set<string>>(new Set());
  
  const [sortBy, setSortBy] = useState<"NEWEST" | "PRICE_DESC" | "PRICE_ASC" | "NAME_ASC" | "NAME_DESC">("NEWEST");
  const [viewMode, setViewMode] = useState<"cards" | "sealed">("cards");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);

  // Modal state
  const [bulkPercent, setBulkPercent] = useState("100");
  const [cardPricing, setCardPricing] = useState<Record<string, PricingState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Import Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importStats, setImportStats] = useState({ cards: 0, rows: 0, uniqueScryfallIds: 0 });
  const [importing, setImporting] = useState(false);

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

  const getInstanceValue = (instance: any) => {
    if (instance.customPrice && instance.customPrice > 0) return instance.customPrice;
    const isReverse = instance.notes?.includes("Reverse Holo");
    if (isReverse && instance.Card.reversePrice && instance.Card.reversePrice > 0) return instance.Card.reversePrice;
    const isFoil = instance.notes?.includes("Foil");
    if (isFoil && instance.Card.foilPrice && instance.Card.foilPrice > 0) return instance.Card.foilPrice;
    return instance.Card.marketPrice || 0;
  };

  const displayedCards = useMemo(() => {
    let filtered = activeGame === "both"
      ? cards
      : cards.filter((c) => c.Card.game.toLowerCase() === activeGame);
      
    if (filterGames.size > 0) {
      filtered = filtered.filter(c => filterGames.has(c.Card.game.toUpperCase()));
    }
    
    if (filterConditions.size > 0) {
      filtered = filtered.filter(c => c.condition && filterConditions.has(c.condition));
    }
    if (filterVariants.size > 0) {
      filtered = filtered.filter(c => {
        if (!c.notes) return false;
        const notesArr = c.notes.split(",").map(n => n.trim());
        return Array.from(filterVariants).some(v => notesArr.includes(v));
      });
    }

    if (sortBy === "PRICE_ASC") {
      filtered.sort((a, b) => getInstanceValue(a) - getInstanceValue(b));
    } else if (sortBy === "PRICE_DESC") {
      filtered.sort((a, b) => getInstanceValue(b) - getInstanceValue(a));
    } else if (sortBy === "NAME_ASC") {
      filtered.sort((a, b) => a.Card.name.localeCompare(b.Card.name));
    } else if (sortBy === "NAME_DESC") {
      filtered.sort((a, b) => b.Card.name.localeCompare(a.Card.name));
    } else if (sortBy === "NEWEST") {
      // Assuming original order is newest, or we could leave it
    }

    return filtered;
  }, [cards, activeGame, filterGames, filterConditions, filterVariants, sortBy]);

  const uniqueGames = useMemo(() => Array.from(new Set(cards.map(c => c.Card.game.toUpperCase()))).filter(Boolean), [cards]);
  const uniqueConditions = useMemo(() => {
    const conditions = new Set<string>();
    cards.forEach(instance => {
      if (instance.condition) conditions.add(instance.condition);
    });
    return Array.from(conditions).sort();
  }, [cards]);

  const uniqueVariants = useMemo(() => {
    const variants = new Set<string>();
    cards.forEach(instance => {
      if (instance.notes) {
        instance.notes.split(",").forEach((note) => {
          const t = note.trim();
          if (t) variants.add(t);
        });
      }
    });
    return Array.from(variants).sort();
  }, [cards]);


  const groupedCards = useMemo(() => {
    const groups = new Map<string, typeof displayedCards>();
    for (const c of displayedCards) {
      const isListed = (c.Listings?.length ?? 0) > 0;
      const key = `${c.Card.id}-${c.condition}-${c.notes}-${c.customPrice}-${isListed ? 'listed' : 'unlisted'}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    }
    return Array.from(groups.values());
  }, [displayedCards]);

  

  const totalValue = displayedCards.reduce((acc, curr) => acc + getInstanceValue(curr), 0);
  const selectedValue = displayedCards
    .filter((c) => selected.has(c.id))
    .reduce((acc, curr) => acc + getInstanceValue(curr), 0);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === displayedCards.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(displayedCards.map((c) => c.id)));
    }
  };


  const handleDelete = async (ids: string[]) => {
    if (!confirm(`Are you sure you want to remove ${ids.length} item(s) from your vault?`)) return;
    setDeleting(true);
    const res = await removeFromVault(ids);
    if (res.success) {
      toast.success(`Removed ${ids.length} item(s) from vault`);
      setSelected(new Set());
      const res2 = await getVault();
      if (res2.success && res2.instances) setCards(res2.instances);
    } else {
      toast.error(res.error || "Failed to remove items");
    }
    setDeleting(false);
  };

  const openModal = () => {
    // Default every card to the bulk % pricing
    const initial: Record<string, PricingState> = {};
    for (const id of selected) initial[id] = { mode: "default", value: "", skip: false };
    setCardPricing(initial);
    setBulkPercent("100");
    setNotice(null);
    setModalOpen(true);
  };

  const priceForCard = (card: VaultCard, ps: PricingState | undefined): number => {
    const market = card.Card.marketPrice || 0;
    if (!ps || ps.mode === "default") return market * (Number(bulkPercent) / 100);
    if (ps.mode === "percent") return market * (Number(ps.value || 0) / 100);
    return Number(ps.value || 0);
  };

  const previewListings = useMemo(() => {
    return displayedCards
      .filter((c) => selected.has(c.id))
      .map((c) => {
        const ps = cardPricing[c.id];
        if (ps?.skip) return null;
        const price = priceForCard(c, ps);
        if (price <= 0) return null;
        return { id: c.id, name: c.Card.name, market: c.Card.marketPrice, price };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedCards, selected, cardPricing, bulkPercent]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setNotice(null);
    const overrides: ListingOverride[] = Object.entries(cardPricing).map(
      ([instanceId, ps]) => ({
        instanceId,
        skip: ps.skip,
        ...(ps.mode !== "default" && ps.value !== "" && Number(ps.value) > 0
          ? { mode: ps.mode, value: Number(ps.value) }
          : {}),
      })
    );

    const res = await markForSale([...selected], Number(bulkPercent), overrides);
    setSubmitting(false);

    if (res.success) {
      setModalOpen(false);
      setSelected(new Set());
      // Reload to reflect active listings on cards
      const vaultRes = await getVault();
      if (vaultRes.success && vaultRes.instances) setCards(vaultRes.instances);
    } else {
      setNotice(res.error || "Something went wrong");
    }
  };

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 lg:px-12 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 border-b border-white/10 pb-8">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl text-white font-light uppercase tracking-widest mb-3">
            Your <span className={brandColor}>Vault</span>
          </h1>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <p className="font-sans text-neutral-400 text-sm tracking-[0.2em] uppercase">
              Collection & Portfolio Growth
            </p>
            <Link href="/analytics" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors rounded-lg font-sans text-[10px] uppercase tracking-widest">
              View Analytics
            </Link>
          </div>
        </div>

        
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Collection Grid */}
        <div className="lg:col-span-3">
          
            {cards.length > 0 && (
              <div className="flex flex-wrap gap-4 mb-6">
                {cards.length > 1 && (
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans text-[10px] uppercase tracking-widest focus:outline-none focus:border-white/30"
                  >
                    <option value="NEWEST">Sort: Newest</option>
                    <option value="PRICE_DESC">Price: High to Low</option>
                    <option value="PRICE_ASC">Price: Low to High</option>
                    <option value="NAME_ASC">Name: A to Z</option>
                    <option value="NAME_DESC">Name: Z to A</option>
                  </select>
                )}

                {uniqueGames.length > 1 && activeGame === "both" && (
                  <MultiSelect 
                    options={uniqueGames}
                    selected={filterGames}
                    onChange={setFilterGames}
                    placeholder="All Games"
                    formatOption={(g) => g === 'MTG' ? 'Magic: The Gathering' : g === 'POKEMON' ? 'Pokémon' : g}
                  />
                )}

                {uniqueConditions.length > 1 && (
                  <MultiSelect 
                    options={uniqueConditions}
                    selected={filterConditions}
                    onChange={setFilterConditions}
                    placeholder="All Conditions"
                    formatOption={(c) => c.replace(/_/g, ' ')}
                  />
                )}
                {uniqueVariants.length > 1 && (
                  <MultiSelect 
                    options={uniqueVariants}
                    selected={filterVariants}
                    onChange={setFilterVariants}
                    placeholder="All Variants"
                  />
                )}
              </div>
            )}

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
            <div className="flex items-center gap-4">
              <label className={`cursor-pointer text-[10px] uppercase tracking-widest ${brandColor} hover:text-white transition-colors flex items-center gap-1`}>
                <Plus size={12} /> Import CSV
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const text = await file.text();
                    
                    const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
                    if (lines.length < 2) {
                      toast.error("Empty or invalid CSV file");
                      return;
                    }
                    const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
                    const scryfallIdIdx = headers.findIndex(h => h.toLowerCase() === "scryfall id");
                    const quantityIdx = headers.findIndex(h => h.toLowerCase() === "quantity");
                    
                    let totalCards = 0;
                    let uniqueScryfallIds = new Set();
                    let rows = 0;
                    
                    if (scryfallIdIdx !== -1) {
                      for (let i = 1; i < lines.length; i++) {
                        const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.replace(/^"|"$/g, "").trim());
                        const sid = row[scryfallIdIdx];
                        if (sid) {
                          rows++;
                          uniqueScryfallIds.add(sid);
                          const qty = quantityIdx !== -1 && row[quantityIdx] ? parseInt(row[quantityIdx], 10) : 1;
                          totalCards += qty;
                        }
                      }
                    }

                    if (totalCards === 0) {
                      toast.error("No valid Scryfall IDs found in CSV");
                      return;
                    }

                    setImportStats({ cards: totalCards, rows, uniqueScryfallIds: uniqueScryfallIds.size });
                    setImportText(text);
                    setImportModalOpen(true);
                    
                    e.target.value = "";
                  }}
                />
              </label>
              <button onClick={() => useGameStore.getState().setSearchOpen(true, "cards")} className={`text-[10px] uppercase tracking-widest ${brandColor} hover:text-white transition-colors flex items-center gap-1`}>
                <Search size={12} /> Search to Add
              </button>
            </div>
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
            <>
              {/* Selection toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-neutral-900/40 border border-white/5 rounded-xl px-5 py-4">
                <div className="flex items-center gap-5">
                  <button
                    onClick={selectAll}
                    className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selected.size === displayedCards.length ? `${brandBg} border-transparent` : "border-white/30"}`}>
                      {selected.size === displayedCards.length && <Check size={12} className="text-black" />}
                    </span>
                    Select All
                  </button>
                  {selected.size > 0 && (
                    <>
                      <span className="font-sans text-[10px] uppercase tracking-widest text-neutral-500">
                        <span className="text-white">{selected.size}</span> selected ·{" "}
                        <span className={brandColor}>${selectedValue.toFixed(2)}</span> market value
                      </span>
                      <button
                        onClick={() => setSelected(new Set())}
                        className="font-sans text-[10px] uppercase tracking-widest text-neutral-600 hover:text-neutral-300 transition-colors"
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDelete(Array.from(selected))}
                  disabled={selected.size === 0 || deleting}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-sans text-[10px] uppercase tracking-widest transition-all ${
                    selected.size === 0
                      ? "border border-white/10 text-neutral-600 cursor-not-allowed"
                      : "border border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                  }`}
                >
                  <Trash2 size={12} /> {deleting ? "Removing..." : `Remove (${selected.size})`}
                </button>
                <button
                  onClick={openModal}
                  disabled={selected.size === 0}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-sans text-[10px] uppercase tracking-widest transition-all ${
                    selected.size === 0
                      ? "border border-white/10 text-neutral-600 cursor-not-allowed"
                      : "bg-white text-black hover:bg-neutral-200"
                  }`}
                >
                  <Tag size={12} /> Mark for Sale{selected.size > 0 ? ` (${selected.size})` : ""}
                </button>
              </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {groupedCards.map((group, i) => {
                  const instance = group[0];
                  const qty = group.length;
                  const groupIds = group.map(g => g.id);
                  const isSelected = groupIds.every(id => selected.has(id));
                  const isPartial = groupIds.some(id => selected.has(id)) && !isSelected;
                  
                  const handleToggleGroup = () => {
                    setSelected(prev => {
                      const next = new Set(prev);
                      if (isSelected) {
                        groupIds.forEach(id => next.delete(id));
                      } else {
                        groupIds.forEach(id => next.add(id));
                      }
                      return next;
                    });
                  };

                  const activeListing = instance.Listings?.[0];
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (i % 20) * 0.05, duration: 0.4 }}
                      key={instance.id}
                      onClick={handleToggleGroup}
                      className={`group relative flex flex-col gap-2 p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected || isPartial
                          ? `bg-neutral-900 border-white/40 ring-1 ring-white/20`
                          : "bg-neutral-900/40 border-white/5 hover:bg-neutral-900"
                      }`}
                    >
                      <div className="relative aspect-[63/88] rounded-lg overflow-hidden bg-black">
                        {instance.Card.imageUrl ? (
                          <Image src={proxiedImage(instance.Card.imageUrl)!} alt={instance.Card.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-neutral-800 font-serif text-xs">No Image</div>
                        )}
                        
                        <div className="absolute top-2 left-2 w-5 h-5 rounded border flex items-center justify-center transition-colors"
                          style={{ pointerEvents: "none" }}
                        >
                          {isSelected ? (
                            <span className={`w-full h-full ${brandBg} flex items-center justify-center`}>
                              <Check size={14} className="text-black" />
                            </span>
                          ) : isPartial ? (
                            <span className={`w-full h-full ${brandBg} flex items-center justify-center`}>
                              <div className="w-2.5 h-0.5 bg-black rounded-full" />
                            </span>
                          ) : (
                            <span className="w-full h-full bg-black/60 border border-white/30" />
                          )}
                        </div>

                        {qty > 1 && (
                          <div className="absolute bottom-2 left-2 w-7 h-7 bg-black/80 backdrop-blur text-white flex items-center justify-center rounded-full text-[10px] font-sans font-bold border border-white/10 shadow-lg pointer-events-none z-10">
                            x{qty}
                          </div>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(groupIds);
                          }}
                          disabled={deleting}
                          className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-neutral-400 hover:text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/10 transition-colors z-20 opacity-0 group-hover:opacity-100 disabled:opacity-50 shadow-xl backdrop-blur-sm"
                        >
                          <Trash2 size={12} />
                        </button>
                        {activeListing && (
                          <div className="absolute top-2 right-2 bg-emerald-500/90 text-black px-2 py-0.5 rounded text-[8px] font-sans font-bold uppercase tracking-widest z-10">
                            ${activeListing.price.toFixed(2)}
                          </div>
                        )}
                        {!activeListing && (
                          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[8px] font-sans uppercase tracking-widest text-white border border-white/10 z-10">
                            {instance.condition.replace("_", " ")}
                          </div>
                        )}
                      </div>
                      <div className="mt-1">
                        <h3 className="font-serif text-sm text-white truncate">{instance.Card.name}</h3>
                        <div className="flex justify-between items-center mt-1">
                          <p className="font-sans text-[9px] uppercase tracking-widest text-neutral-500 truncate mr-2">
                            {instance.Card.setCode ? `${instance.Card.setCode} · ` : ""}{instance.Card.number ? `#${instance.Card.number}` : instance.Card.setName}
                          </p>
                          {getInstanceValue(instance) > 0 && (
                            <div className="flex flex-col items-end">
                              <p className={`font-serif text-xs ${brandColor}`}>${getInstanceValue(instance).toFixed(2)}</p>
                              {instance.notes?.includes("Reverse Holo") && !instance.customPrice && instance.Card.reversePrice && <span className="text-[7px] uppercase tracking-widest text-purple-400">Reverse</span>}
                              {instance.notes?.includes("Foil") && !instance.customPrice && instance.Card.foilPrice && <span className="text-[7px] uppercase tracking-widest text-blue-400">Foil</span>}
                              {instance.customPrice && <span className="text-[7px] uppercase tracking-widest text-emerald-400">Custom</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-6">
                    <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-6 flex flex-col min-h-[300px]">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className={`w-5 h-5 ${brandColor}`} />
              <h3 className="font-serif text-white text-lg">Market Pulse</h3>
            </div>

            {cards.length < 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-50 text-center px-4">
                <Lock className="w-8 h-8 text-neutral-500 mb-3" />
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-neutral-400">Unlock at 50 Cards</p>
                <p className="font-serif text-xs text-neutral-500 mt-2">Currently at {cards.length}/50</p>
                <div className="w-full bg-black rounded-full h-1 mt-4 overflow-hidden">
                  <div className={`h-full ${brandColor} opacity-50`} style={{ width: `${(cards.length / 50) * 100}%` }} />
                </div>
              </div>
            ) : (
              <div className="space-y-6 flex-1">
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Portfolio Value</p>
                  <p className={`font-serif text-3xl ${brandColor}`}>
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-sans text-xs text-neutral-400">Total Cards</span>
                    <span className="font-serif text-white">{displayedCards.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-sans text-xs text-neutral-400">Unique Cards</span>
                    <span className="font-serif text-white">{new Set(displayedCards.map(c => c.Card.id)).size}</span>
                  </div>
                </div>

                {displayedCards.length > 0 && (
                  <div className="pt-4 border-t border-white/5">
                    <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-3">Top Asset</p>
                    {(() => {
                      const topCard = [...displayedCards].sort((a, b) => getInstanceValue(b) - getInstanceValue(a))[0];
                      return topCard ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 bg-black rounded shrink-0 relative overflow-hidden border border-white/10">
                            {topCard.Card.imageUrl && <Image src={proxiedImage(topCard.Card.imageUrl)!} alt={topCard.Card.name} fill className="object-cover" unoptimized />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-serif text-white text-xs truncate">{topCard.Card.name}</h4>
                            <p className={`font-serif text-[10px] ${brandColor}`}>
                              ${getInstanceValue(topCard).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-6">
            <h3 className="font-sans text-xs uppercase tracking-widest text-neutral-500 mb-4 pb-2 border-b border-white/10">Recent Additions</h3>
            <div className="space-y-4">
              {displayedCards.slice(0, 4).map((instance) => (
                <div key={instance.id} className="flex items-center gap-3">
                  <div className="w-10 h-14 bg-black rounded shrink-0 relative overflow-hidden border border-white/10">
                    {instance.Card.imageUrl && <Image src={proxiedImage(instance.Card.imageUrl)!} alt={instance.Card.name} fill className="object-cover" unoptimized />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-serif text-white text-xs truncate">{instance.Card.name}</h4>
                    <p className={`font-serif text-[10px] ${brandColor}`}>${getInstanceValue(instance).toFixed(2) || "0.00"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mark for Sale Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setModalOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <div>
                <h2 className="font-serif text-2xl text-white uppercase tracking-widest">Mark for Sale</h2>
                <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 mt-1">
                  {selected.size} card{selected.size !== 1 ? "s" : ""} · ${selectedValue.toFixed(2)} market value
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-neutral-500 hover:text-white text-2xl leading-none">&times;</button>
            </div>

            {/* Bulk pricing */}
            <div className="p-6 border-b border-white/10">
              <label className="block font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-3">
                Default price for all selected cards — % of TCGCSV Market Price
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={bulkPercent}
                  onChange={(e) => setBulkPercent(e.target.value)}
                  className="w-28 bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white font-serif focus:outline-none focus:border-white/30"
                />
                <span className="text-white text-lg font-serif">%</span>
                <div className="flex gap-2 ml-2">
                  {[80, 90, 100, 110].map((p) => (
                    <button
                      key={p}
                      onClick={() => setBulkPercent(String(p))}
                      className={`px-3 py-1.5 rounded-md font-sans text-[10px] uppercase tracking-widest border transition-colors ${
                        bulkPercent === String(p)
                          ? "bg-white text-black border-white"
                          : "border-white/10 text-neutral-400 hover:text-white hover:border-white/30"
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
              <p className="font-sans text-[9px] uppercase tracking-widest text-neutral-600 mt-2">
                {previewListings.length} of {selected.size} cards will be listed
              </p>
            </div>

            {/* Per-card overrides */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 sticky top-0">
                Optional: per-card overrides
              </p>
              {displayedCards
                .filter((c) => selected.has(c.id))
                .map((card) => {
                  const ps = cardPricing[card.id] ?? { mode: "default" as const, value: "", skip: false };
                  const price = priceForCard(card, ps);
                  return (
                    <div
                      key={card.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        ps.skip ? "opacity-40 border-white/5" : "border-white/10 bg-black/30"
                      }`}
                    >
                      <div className="w-9 h-12 relative rounded overflow-hidden bg-black border border-white/10 shrink-0">
                        {card.Card.imageUrl && <Image src={proxiedImage(card.Card.imageUrl)!} alt={card.Card.name} fill className="object-cover" unoptimized />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-serif text-sm text-white truncate">{card.Card.name}</h4>
                        <p className={`font-serif text-[10px] ${brandColor}`}>
                          Market: ${card.Card.marketPrice.toFixed(2)} → List: ${price.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={ps.mode}
                          onChange={(e) =>
                            setCardPricing((prev) => ({
                              ...prev,
                              [card.id]: { ...ps, mode: e.target.value as PricingState["mode"] },
                            }))
                          }
                          className="bg-black/50 border border-white/10 rounded-lg px-2 py-2 font-sans text-[10px] uppercase tracking-widest text-white focus:outline-none focus:border-white/30"
                        >
                          <option value="default">Bulk %</option>
                          <option value="percent">% of Market</option>
                          <option value="flat">Flat $</option>
                        </select>
                        {ps.mode !== "default" && (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ps.value}
                            placeholder={ps.mode === "percent" ? "100" : "0.00"}
                            onChange={(e) =>
                              setCardPricing((prev) => ({
                                ...prev,
                                [card.id]: { ...ps, value: e.target.value },
                              }))
                            }
                            className="w-20 bg-black/50 border border-white/10 rounded-lg px-2 py-2 text-white font-serif text-sm focus:outline-none focus:border-white/30"
                          />
                        )}
                        <button
                          onClick={() =>
                            setCardPricing((prev) => ({
                              ...prev,
                              [card.id]: { ...ps, skip: !ps.skip },
                            }))
                          }
                          title={ps.skip ? "Include card" : "Exclude card"}
                          className={`p-2 rounded-lg border transition-colors ${
                            ps.skip
                              ? "border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
                              : "border-white/10 text-neutral-500 hover:text-white"
                          }`}
                        >
                          {ps.skip ? <X size={14} /> : <Tag size={14} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="p-6 border-t border-white/10">
              {notice && (
                <p className="font-sans text-[10px] uppercase tracking-widest text-rose-400 mb-3">{notice}</p>
              )}
              <div className="flex items-center justify-between gap-4">
                <div className="font-serif text-sm text-neutral-300">
                  Total ask:{" "}
                  <span className="text-white">
                    ${previewListings.reduce((acc, l) => acc + l.price, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-6 py-3 border border-white/20 text-neutral-300 hover:text-white hover:border-white rounded-lg font-sans text-[10px] uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || previewListings.length === 0}
                    className="px-8 py-3 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 rounded-lg font-sans text-[10px] uppercase tracking-widest transition-colors"
                  >
                    {submitting ? "Listing..." : `List ${previewListings.length} Card${previewListings.length !== 1 ? "s" : ""}`}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !importing && setImportModalOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
              <div>
                <h3 className="font-serif text-2xl text-white mb-1">Import Collection</h3>
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  Review your CSV import
                </p>
              </div>
              {!importing && (
                <button onClick={() => setImportModalOpen(false)} className="text-neutral-500 hover:text-white text-2xl leading-none">&times;</button>
              )}
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/5 text-center">
                  <div className="font-serif text-3xl text-white mb-1">{importStats.cards}</div>
                  <div className="font-sans text-[9px] uppercase tracking-[0.2em] text-neutral-500">Total Cards</div>
                </div>
                <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/5 text-center">
                  <div className="font-serif text-3xl text-white mb-1">{importStats.uniqueScryfallIds}</div>
                  <div className="font-sans text-[9px] uppercase tracking-[0.2em] text-neutral-500">Unique Prints</div>
                </div>
              </div>
              
              <div className="text-center font-sans text-sm text-neutral-400">
                You are about to import <span className="text-white font-bold">{importStats.cards}</span> physical cards across <span className="text-white font-bold">{importStats.uniqueScryfallIds}</span> distinct prints. They will be added to your vault, stacking duplicates together automatically.
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setImportModalOpen(false)}
                disabled={importing}
                className="px-6 py-3 border border-white/20 text-neutral-300 hover:text-white hover:border-white rounded-lg font-sans text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setImporting(true);
                  const toastId = toast.loading("Importing CSV...");
                  const { importManaboxCSV } = await import("@/app/actions/import");
                  const res = await importManaboxCSV(importText);
                  setImporting(false);
                  setImportModalOpen(false);
                  
                  if (res.success) {
                    toast.update(toastId, { render: `Imported ${res.count} cards!`, type: "success", isLoading: false, autoClose: 3000 });
                    const vaultRes = await getVault();
                    if (vaultRes.success && vaultRes.instances) setCards(vaultRes.instances);
                  } else {
                    toast.update(toastId, { render: res.error || "Import failed", type: "error", isLoading: false, autoClose: 3000 });
                  }
                }}
                disabled={importing}
                className={`px-8 py-3 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 rounded-lg font-sans text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2`}
              >
                {importing ? "Importing..." : "Confirm Import"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
