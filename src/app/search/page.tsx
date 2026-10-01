"use client";
import { toast } from "react-toastify";

import { useSearchParams, useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { useEffect, useState, Suspense, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, RefreshCw, Check, CloudDownload } from "lucide-react";
import { searchCatalog, getCatalogStatus, startCatalogSync, type CatalogCard } from "@/app/actions/search";
import { addToVault } from "@/app/actions/vault";

function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const name = searchParams.get("name") || "";
  const set = searchParams.get("set") || "";
  const number = searchParams.get("number") || "";
  const user = searchParams.get("user") || "";

  const activeGame = useGameStore((state) => state.activeGame);
  const brandColor = activeGame === "pokemon" ? "text-yellow-400" : activeGame === "mtg" ? "text-orange-500" : "text-emerald-400";

  const [results, setResults] = useState<CatalogCard[]>([]);
  const [setsSynced, setSetsSynced] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  
  // Vault Modal State
  const [selectedCard, setSelectedCard] = useState<CatalogCard | null>(null);
  const [vaultQuantity, setVaultQuantity] = useState(1);
  const [vaultCondition, setVaultCondition] = useState("NEAR_MINT");
  const [vaultNotes, setVaultNotes] = useState("");
  const [isFoil, setIsFoil] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const [isSubmittingVault, setIsSubmittingVault] = useState(false);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [catalog, setCatalog] = useState<{ groups: number; cards: number; syncedGroups: number; groupsError?: string | null; sync: { running: boolean; done: number; total: number; currentGroup: string | null } } | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user) return;
    getCatalogStatus(activeGame ?? "both")
      .then(setCatalog)
      .catch((err) => {
        console.error("Catalog status failed:", err);
        // Still show the banner so the sync button is reachable
        setCatalog({ groups: 0, cards: 0, syncedGroups: 0, groupsError: "status unavailable", sync: { running: false, done: 0, total: 0, currentGroup: null } });
      });
  }, [user, activeGame]);

  useEffect(() => {
    async function performSearch() {
      if (user) return;
      if (!name && !set && !number) return;

      setLoading(true);
      try {
        const res = await searchCatalog({
          name: name || undefined,
          set: set || undefined,
          number: number || undefined,
          game: activeGame ?? "both",
        });
        setResults(res.results);
        setSetsSynced(res.setsSynced);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }

    performSearch();
  }, [name, set, number, user, activeGame]);

  const handleFullSync = useCallback(async () => {
    setSyncing(true);
    try {
      await startCatalogSync(activeGame ?? "both");
      // Poll progress until done
      const poll = setInterval(async () => {
        const status = await getCatalogStatus(activeGame ?? "both");
        setCatalog(status);
        if (!status.sync.running) {
          clearInterval(poll);
          setSyncing(false);
          // Re-run the current search now that more data exists
          if (name || set || number) {
            const res = await searchCatalog({
              name: name || undefined,
              set: set || undefined,
              number: number || undefined,
              game: activeGame ?? "both",
            });
            setResults(res.results);
          }
        }
      }, 3000);
    } catch (err) {
      console.error(err);
      setSyncing(false);
    }
  }, [activeGame, name, set, number]);

  const openAddModal = (card: CatalogCard) => {
    if (added[card.tcgcsvId]) {
      toast.info("This card is already added during this session.");
      return;
    }
    setSelectedCard(card);
    setVaultQuantity(1);
    setVaultCondition("NEAR_MINT");
    setVaultNotes("");
    setIsFoil(false);
    setIsSigned(false);
    setCustomPrice("");
  };

  const handleConfirmAdd = async () => {
    if (!selectedCard) return;
    setIsSubmittingVault(true);

    const gameType = selectedCard.game.toLowerCase() === "pokemon" ? "pokemon" : "mtg";

    const res = await addToVault({
      tcgcsvId: selectedCard.tcgcsvId,
      game: gameType as any,
      name: selectedCard.name,
      setName: selectedCard.setName,
      imageUrl: selectedCard.imageUrl || "",
      rarity: selectedCard.rarity || undefined,
      marketPrice: selectedCard.marketPrice,
      setCode: selectedCard.setCode || undefined,
      number: selectedCard.number || undefined,
      condition: vaultCondition,
      quantity: vaultQuantity,
      notes: [isFoil ? "Foil" : "", isSigned ? "Signed" : "", vaultNotes].filter(Boolean).join(", "),
      customPrice: customPrice ? parseFloat(customPrice) : undefined
    });

    if (res.success) {
      setAdded((prev) => ({ ...prev, [selectedCard.tcgcsvId]: true }));
      toast.success(`Added ${vaultQuantity}x ${selectedCard.name} to Vault`);
      setSelectedCard(null);
    } else {
      toast.error(res.error || "Failed to add to vault");
    }
    
    setIsSubmittingVault(false);
  };

  const syncPct = catalog && catalog.groups > 0 ? Math.round((catalog.syncedGroups / catalog.groups) * 100) : 0;

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 lg:px-12 max-w-[1400px] mx-auto">
      <div className="mb-16 border-b border-white/10 pb-8">
        <h1 className="font-serif text-4xl md:text-5xl text-white font-light uppercase tracking-widest mb-3">
          Search <span className={brandColor}>Results</span>
        </h1>
        <p className="font-sans text-neutral-400 text-sm tracking-[0.2em] uppercase">
          {user ? `User: ${user}` : `Query: ${name} ${set && `| Set: ${set}`} ${number && `| #: ${number}`}`}
        </p>
      </div>

      {user ? (
        <div className="py-20 text-center flex flex-col items-center justify-center opacity-50">
          <p className="font-serif text-2xl text-neutral-400 mb-2">User Indexing</p>
          <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500">
            User search will be available shortly.
          </p>
        </div>
      ) : (
        <>
          {/* Catalog status / full sync banner */}
          {catalog && (
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900/40 border border-white/5 rounded-xl px-6 py-4">
              <div className="font-sans text-[10px] uppercase tracking-widest text-neutral-400">
                {catalog.groupsError && catalog.groups === 0 ? (
                  <span className="text-rose-400">Catalog status unavailable (TCGCSV unreachable?)</span>
                ) : (
                  <>
                    Catalog: <span className="text-white">{catalog.cards.toLocaleString()}</span> cards from{" "}
                    <span className="text-white">{catalog.syncedGroups}</span>/{catalog.groups} sets ({syncPct}%)
                    {setsSynced.length > 0 && (
                      <span className={brandColor}> · just synced: {setsSynced.join(", ")}</span>
                    )}
                  </>
                )}
              </div>
              <button
                onClick={handleFullSync}
                disabled={syncing}
                className="flex items-center gap-2 px-5 py-2 border border-white/10 rounded-lg font-sans text-[10px] uppercase tracking-widest text-neutral-300 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50 shrink-0"
              >
                {syncing ? <RefreshCw size={12} className="animate-spin" /> : <CloudDownload size={12} />}
                {syncing
                  ? `Syncing${catalog.sync.currentGroup ? `: ${catalog.sync.currentGroup}` : ""} ${catalog.sync.total > 0 ? `(${catalog.sync.done}/${catalog.sync.total})` : ""}`
                  : "Sync full catalog"}
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center text-neutral-500 font-serif italic py-12">Scouring the archives...</div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {results.map((card) => (
                <div 
                  key={card.tcgcsvId} 
                  className="group relative cursor-pointer"
                  onClick={() => openAddModal(card)}
                >
                  <div className="relative aspect-[63/88] rounded-xl overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors mb-3">
                    {card.imageUrl ? (
                      <Image src={card.imageUrl} alt={card.name} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-500 font-serif text-xs">No Image</div>
                    )}
                    {card.marketPrice > 0 && (
                      <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[9px] font-serif text-white border border-white/10">
                        ${card.marketPrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-serif text-white text-sm truncate group-hover:text-blue-400 transition-colors">{card.name}</h3>
                  <p className="font-sans text-[9px] uppercase tracking-widest text-neutral-500 truncate">
                    {card.setName} {card.number && `• #${card.number}`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center opacity-50">
              <p className="font-serif text-2xl text-neutral-400 mb-2">No Results Found</p>
              <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-6 max-w-md leading-relaxed">
                {catalog && catalog.cards === 0
                  ? "The card catalog is empty — enter a set code (e.g. OTP, PAF, SWSH12) to pull that set from TCGCSV, or sync the full catalog above."
                  : catalog && catalog.syncedGroups < catalog.groups
                    ? "Only a few sets are ingested so far. Try a set code, or sync the full catalog above to search by name across everything."
                    : "Try adjusting your search parameters."}
              </p>
              <Link href="/database" className="font-sans text-[10px] uppercase tracking-widest text-neutral-400 border-b border-white/20 pb-1">
                Browse by set instead
              </Link>
            </div>
          )}
        </>
      )}
    
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-white/20 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => setSelectedCard(null)} className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors">
              &times;
            </button>
            <h2 className="font-serif text-2xl text-white mb-2 truncate">{selectedCard.name}</h2>
            <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-400 mb-6">{selectedCard.setName}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Quantity</label>
                <input 
                  type="number" 
                  min="1" 
                  max="100" 
                  value={vaultQuantity} 
                  onChange={(e) => setVaultQuantity(parseInt(e.target.value) || 1)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Condition</label>
                <select 
                  value={vaultCondition}
                  onChange={(e) => setVaultCondition(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans focus:outline-none focus:border-white/30"
                >
                  <option value="MINT">Mint (M)</option>
                  <option value="NEAR_MINT">Near Mint (NM)</option>
                  <option value="LIGHTLY_PLAYED">Lightly Played (LP)</option>
                  <option value="MODERATELY_PLAYED">Moderately Played (MP)</option>
                  <option value="HEAVILY_PLAYED">Heavily Played (HP)</option>
                  <option value="DAMAGED">Damaged (DMG)</option>
                </select>
              </div>

              
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsFoil(!isFoil)}
                  className={`flex-1 py-2 rounded-lg font-sans text-[10px] uppercase tracking-widest border transition-colors ${isFoil ? 'bg-white text-black border-white' : 'bg-black/50 text-neutral-400 border-white/10 hover:border-white/30'}`}
                >
                  Foil
                </button>
                <button
                  type="button"
                  onClick={() => setIsSigned(!isSigned)}
                  className={`flex-1 py-2 rounded-lg font-sans text-[10px] uppercase tracking-widest border transition-colors ${isSigned ? 'bg-white text-black border-white' : 'bg-black/50 text-neutral-400 border-white/10 hover:border-white/30'}`}
                >
                  Signed
                </button>
              </div>

              <div>
                <label className="block font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Additional Notes (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Graded PSA 9..."
                  value={vaultNotes} 
                  onChange={(e) => setVaultNotes(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans focus:outline-none focus:border-white/30"
                />
              </div>



              
              <div>
                <label className="block font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Custom Price / Appraised Value ($)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  placeholder="e.g. 150.00"
                  value={customPrice} 
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans focus:outline-none focus:border-white/30"
                />
              </div>

              <button 
                onClick={handleConfirmAdd}

                disabled={isSubmittingVault}
                className="w-full mt-4 py-3 bg-white text-black rounded-lg font-sans text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-colors disabled:opacity-50"
              >
                {isSubmittingVault ? "Adding..." : "Add to Vault"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 pb-20 text-center text-neutral-500 font-serif italic">Loading search...</div>}>
      <SearchPage />
    </Suspense>
  );
}
