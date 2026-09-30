"use client";

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

  const handleAdd = async (card: CatalogCard) => {
    if (!activeGame || activeGame === "both") {
      alert("Please select a game first");
      return;
    }
    setAddingId(card.tcgcsvId);
    const res = await addToVault({
      tcgcsvId: card.tcgcsvId,
      game: activeGame === "pokemon" ? "pokemon" : "mtg",
      name: card.name,
      setName: card.setName,
      imageUrl: card.imageUrl || "",
      rarity: card.rarity || undefined,
      marketPrice: card.marketPrice,
      setCode: card.setCode || undefined,
      number: card.number || undefined,
    });
    if (res.success) {
      setAdded((prev) => ({ ...prev, [card.tcgcsvId]: true }));
    } else {
      alert(res.error);
    }
    setAddingId(null);
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
                <div key={card.tcgcsvId} className="group relative">
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
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <button
                        onClick={() => handleAdd(card)}
                        disabled={addingId === card.tcgcsvId || added[card.tcgcsvId]}
                        className="py-3 px-5 bg-white/10 hover:bg-white text-white hover:text-black rounded-full font-sans text-[10px] uppercase tracking-widest border border-white/20 hover:border-white transition-all flex items-center gap-2 disabled:opacity-60"
                      >
                        {added[card.tcgcsvId] ? (
                          <>
                            <Check size={14} /> In Vault
                          </>
                        ) : (
                          <>
                            <Plus size={14} /> {addingId === card.tcgcsvId ? "Adding..." : "Add to Vault"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <h3 className="font-serif text-white text-sm truncate">{card.name}</h3>
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
                  ? "The card catalog is empty — enter a set code (e.g. OTP, PAF, SWSH12) to pull that set from TCGplayer, or sync the full catalog above."
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
