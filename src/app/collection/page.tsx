"use client";

import { useEffect, useState, useMemo } from "react";
import { useGameStore } from "@/lib/store";
import { motion } from "framer-motion";
import { TrendingUp, Plus, Search, Check, X, Tag, DollarSign, Trash2 } from "lucide-react";
import { getVault, removeFromVault } from "@/app/actions/vault";
import { toast } from "react-toastify";
import { markForSale, type ListingOverride } from "@/app/actions/market";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const [filterGame, setFilterGame] = useState<"ALL" | "POKEMON" | "MTG">("ALL");
  const [filterTag, setFilterTag] = useState("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "PRICE_DESC" | "PRICE_ASC">("NEWEST");
  const [viewMode, setViewMode] = useState<"cards" | "sealed">("cards");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);

  // Modal state
  const [bulkPercent, setBulkPercent] = useState("100");
  const [cardPricing, setCardPricing] = useState<Record<string, PricingState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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

  const displayedCards = activeGame === "both"
    ? cards
    : cards.filter((c) => c.Card.game.toLowerCase() === activeGame);

  const getInstanceValue = (instance: any) => {
    if (instance.customPrice && instance.customPrice > 0) return instance.customPrice;
    const isReverse = instance.notes?.includes("Reverse Holo");
    if (isReverse && instance.Card.reversePrice && instance.Card.reversePrice > 0) return instance.Card.reversePrice;
    const isFoil = instance.notes?.includes("Foil");
    if (isFoil && instance.Card.foilPrice && instance.Card.foilPrice > 0) return instance.Card.foilPrice;
    return instance.Card.marketPrice || 0;
  };

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
                {displayedCards.map((instance, i) => {
                  const isSelected = selected.has(instance.id);
                  const activeListing = instance.Listings?.[0];
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (i % 20) * 0.05, duration: 0.4 }}
                      key={instance.id}
                      onClick={() => toggleSelect(instance.id)}
                      className={`group relative flex flex-col gap-2 p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? `bg-neutral-900 border-white/40 ring-1 ring-white/20`
                          : "bg-neutral-900/40 border-white/5 hover:bg-neutral-900"
                      }`}
                    >
                      <div className="relative aspect-[63/88] rounded-lg overflow-hidden bg-black">
                        {instance.Card.imageUrl ? (
                          <Image src={instance.Card.imageUrl} alt={instance.Card.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
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
                          ) : (
                            <span className="w-full h-full bg-black/60 border border-white/30" />
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete([instance.id]);
                          }}
                          disabled={deleting}
                          className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-neutral-400 hover:text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/10 transition-colors z-10 opacity-0 group-hover:opacity-100 disabled:opacity-50 shadow-xl backdrop-blur-sm"
                        >
                          <Trash2 size={12} />
                        </button>
                        {activeListing && (
                          <div className="absolute top-2 right-2 bg-emerald-500/90 text-black px-2 py-0.5 rounded text-[8px] font-sans font-bold uppercase tracking-widest">
                            ${activeListing.price.toFixed(2)}
                          </div>
                        )}
                        {!activeListing && (
                          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[8px] font-sans uppercase tracking-widest text-white border border-white/10">
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
                    {instance.Card.imageUrl && <Image src={instance.Card.imageUrl} alt={instance.Card.name} fill className="object-cover" />}
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
                        {card.Card.imageUrl && <Image src={card.Card.imageUrl} alt={card.Card.name} fill className="object-cover" />}
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
    </main>
  );
}
