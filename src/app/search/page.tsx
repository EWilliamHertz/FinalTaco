"use client";

import { useSearchParams } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";

const CATEGORY_IDS = {
  mtg: 1,
  pokemon: 3,
};

function SearchPage() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "";
  const set = searchParams.get("set") || "";
  const number = searchParams.get("number") || "";
  const user = searchParams.get("user") || "";
  
  const activeGame = useGameStore((state) => state.activeGame);
  const brandColor = activeGame === "pokemon" ? "text-yellow-400" : "text-orange-500";

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function performSearch() {
      if (user) {
        return;
      }

      if (!name && !set && !number) return;
      
      if (!set) {
        setErrorMsg("TCGCSV requires a Set Code (e.g. PAF or DLR) to search for products.");
        return;
      }
      
      setLoading(true);
      setErrorMsg("");
      setResults([]);
      
      try {
        const catId = activeGame === "pokemon" ? CATEGORY_IDS.pokemon : CATEGORY_IDS.mtg;
        
        // 1. Fetch all groups for the category to find the matching abbreviation
        const groupsRes = await fetch(`/api/tcgcsv/groups?categoryId=${catId}`);
        const groupsData = await groupsRes.json();
        
        if (!groupsData.results) {
          throw new Error("Failed to load TCGCSV groups.");
        }
        
        const targetGroup = groupsData.results.find((g: any) => 
          g.abbreviation?.toLowerCase() === set.toLowerCase() || 
          g.name?.toLowerCase().includes(set.toLowerCase())
        );
        
        if (!targetGroup) {
          setErrorMsg(`Could not find a set matching "${set}" in TCGCSV.`);
          setLoading(false);
          return;
        }

        // 2. Fetch products for that specific group
        const productsRes = await fetch(`/api/tcgcsv/products?categoryId=${catId}&groupId=${targetGroup.groupId}`);
        const productsData = await productsRes.json();
        
        if (!productsData.results) {
          throw new Error("Failed to load TCGCSV products.");
        }
        
        // 3. Filter products locally based on name and number
        let filtered = productsData.results;
        
        if (name) {
          filtered = filtered.filter((p: any) => p.name?.toLowerCase().includes(name.toLowerCase()) || p.cleanName?.toLowerCase().includes(name.toLowerCase()));
        }
        
        // We don't have collector number easily exposed on all TCGPlayer products, but we can check extendedData if needed.
        // For now, if number is provided, we can try to filter by extendedData
        if (number) {
          filtered = filtered.filter((p: any) => {
            const numData = p.extendedData?.find((ext: any) => ext.name === "Number");
            return numData && numData.value === number;
          });
        }
        
        setResults(filtered.map((p: any) => ({
          id: p.productId,
          name: p.name,
          setName: targetGroup.name,
          image: p.imageUrl,
          number: p.extendedData?.find((ext: any) => ext.name === "Number")?.value || ""
        })));
        
      } catch (err) {
        console.error(err);
        setErrorMsg("An error occurred while fetching from TCGCSV.");
      }
      setLoading(false);
    }
    
    if (activeGame) {
      performSearch();
    }
  }, [name, set, number, user, activeGame]);

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
      ) : loading ? (
        <div className="text-center text-neutral-500 font-serif italic py-12">Scouring the TCGCSV archives...</div>
      ) : errorMsg ? (
        <div className="py-20 text-center flex flex-col items-center justify-center opacity-80">
          <Search size={48} className="text-neutral-600 mb-6" />
          <p className="font-serif text-2xl text-white mb-2">TCGCSV Search Limitation</p>
          <p className="font-sans text-[10px] uppercase tracking-widest text-rose-400 max-w-md mx-auto">
            {errorMsg}
          </p>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.map((card) => (
            <div key={card.id} className="group relative">
              <div className="relative aspect-[63/88] rounded-xl overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors mb-3 bg-neutral-900/50">
                {card.image ? (
                  <Image src={card.image} alt={card.name} fill className="object-contain p-2" unoptimized />
                ) : (
                  <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-500 font-serif text-xs">No Image</div>
                )}
              </div>
              <h3 className="font-serif text-white text-sm truncate">{card.name}</h3>
              <p className="font-sans text-[9px] uppercase tracking-widest text-neutral-500 truncate">{card.setName} {card.number && `• #${card.number}`}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center flex flex-col items-center justify-center opacity-50">
          <p className="font-serif text-2xl text-neutral-400 mb-2">No Results Found</p>
          <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500">
            No matching cards found in that set.
          </p>
        </div>
      )}
    </main>
  );
}

import { Suspense } from "react";

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 pb-20 text-center text-neutral-500 font-serif italic">Loading search...</div>}>
      <SearchPage />
    </Suspense>
  );
}
