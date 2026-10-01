"use client";
import { toast } from "react-toastify";

import { useSearchParams, useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { searchCatalog, type CatalogCard } from "@/app/actions/search";
import { proxiedImage } from "@/lib/images";
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
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  // Inline search form state (kept in sync with the URL params)
  const [formName, setFormName] = useState(name);
  const [formSet, setFormSet] = useState(set);
  const [formNumber, setFormNumber] = useState(number);
  
  // Vault Modal State
  const [selectedCard, setSelectedCard] = useState<CatalogCard | null>(null);
  const [vaultQuantity, setVaultQuantity] = useState(1);
  const [vaultCondition, setVaultCondition] = useState("NEAR_MINT");
  const [vaultNotes, setVaultNotes] = useState("");
  const [isFoil, setIsFoil] = useState(false);
  const [isReverse, setIsReverse] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const [isSubmittingVault, setIsSubmittingVault] = useState(false);
  const [added, setAdded] = useState<Record<string, boolean>>({});

  // Keep the inline form in sync when the URL changes
  useEffect(() => {
    setFormName(name);
    setFormSet(set);
    setFormNumber(number);
  }, [name, set, number]);

  // Send /search?user=... straight to that collector's profile
  useEffect(() => {
    if (user) router.replace(`/profile/${encodeURIComponent(user)}`);
  }, [user, router]);

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
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }

    performSearch();
  }, [name, set, number, user, activeGame]);

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
    setIsReverse(false);
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
      foilPrice: selectedCard.foilPrice,
      reversePrice: selectedCard.reversePrice,
      setCode: selectedCard.setCode || undefined,
      number: selectedCard.number || undefined,
      condition: vaultCondition,
      quantity: vaultQuantity,
      notes: [isFoil ? "Foil" : "", isReverse ? "Reverse Holo" : "", isSigned ? "Signed" : "", vaultNotes].filter(Boolean).join(", "),
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
        <div className="py-20 text-center font-serif italic text-neutral-500">Taking you to @{user}...</div>
      ) : (
        <>
          {/* Inline search form so you can refine without leaving the page */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const params = new URLSearchParams();
              if (formName.trim()) params.set("name", formName.trim());
              if (formSet.trim()) params.set("set", formSet.trim());
              if (formNumber.trim()) params.set("number", formNumber.trim());
              router.push(`/search?${params.toString()}`);
            }}
            className="mb-12 bg-neutral-900/40 border border-white/5 rounded-xl p-6 flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_140px_auto] gap-4 items-end">
              <div>
                <label className="block font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Card Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Charizard or Fire // Ice"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors font-serif"
                />
              </div>
              <div>
                <label className="block font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Set Code</label>
                <input
                  type="text"
                  value={formSet}
                  onChange={(e) => setFormSet(e.target.value)}
                  placeholder="e.g. PAF"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors font-serif"
                />
              </div>
              <div>
                <label className="block font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Collector #</label>
                <input
                  type="text"
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                  placeholder="e.g. 234"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors font-serif"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-3 bg-white text-black hover:bg-neutral-200 transition-colors rounded-lg font-sans text-xs uppercase tracking-widest h-[46px] flex items-center justify-center gap-2"
              >
                <Search size={14} /> Search
              </button>
            </div>
          </form>

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
                      <Image src={proxiedImage(card.imageUrl)!} alt={card.name} fill className="object-cover" unoptimized />
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
                Try adjusting your search parameters.
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
            <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-400 mb-2">{selectedCard.setName}</p>
            <div className="mb-6 font-serif text-lg text-emerald-400">
              {customPrice 
                ? `$${parseFloat(customPrice).toFixed(2)}` 
                : isReverse && selectedCard.reversePrice && selectedCard.reversePrice > 0
                  ? `$${selectedCard.reversePrice.toFixed(2)}`
                  : isFoil && selectedCard.foilPrice && selectedCard.foilPrice > 0
                    ? `$${selectedCard.foilPrice.toFixed(2)}`
                    : `$${selectedCard.marketPrice.toFixed(2)}`
              }
            </div>
            
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

              
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setIsFoil(!isFoil); setIsReverse(false); }}
                  className={`flex-1 py-2 flex flex-col items-center justify-center rounded-lg font-sans text-[10px] uppercase tracking-widest border transition-colors ${isFoil ? 'bg-white text-black border-white' : 'bg-black/50 text-neutral-400 border-white/10 hover:border-white/30'}`}
                >
                  <span>Foil</span>
                  {selectedCard.foilPrice && selectedCard.foilPrice > 0 ? (
                    <span className={`text-[8px] mt-0.5 ${isFoil ? 'text-black/60' : 'text-blue-400'}`}>${selectedCard.foilPrice.toFixed(2)}</span>
                  ) : null}
                </button>
                {selectedCard.game === "pokemon" && (
                  <button
                    type="button"
                    onClick={() => { setIsReverse(!isReverse); setIsFoil(false); }}
                    className={`flex-1 py-2 flex flex-col items-center justify-center rounded-lg font-sans text-[10px] uppercase tracking-widest border transition-colors ${isReverse ? 'bg-white text-black border-white' : 'bg-black/50 text-neutral-400 border-white/10 hover:border-white/30'}`}
                  >
                    <span>Reverse</span>
                    {selectedCard.reversePrice && selectedCard.reversePrice > 0 ? (
                      <span className={`text-[8px] mt-0.5 ${isReverse ? 'text-black/60' : 'text-purple-400'}`}>${selectedCard.reversePrice.toFixed(2)}</span>
                    ) : null}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsSigned(!isSigned)}
                  className={`flex-1 py-2 flex flex-col items-center justify-center rounded-lg font-sans text-[10px] uppercase tracking-widest border transition-colors ${isSigned ? 'bg-white text-black border-white' : 'bg-black/50 text-neutral-400 border-white/10 hover:border-white/30'}`}
                >
                  <span>Signed</span>
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
