"use client";

import { useSearchParams } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "";
  const set = searchParams.get("set") || "";
  const number = searchParams.get("number") || "";
  const user = searchParams.get("user") || "";
  
  const activeGame = useGameStore((state) => state.activeGame);
  const brandColor = activeGame === "pokemon" ? "text-yellow-400" : "text-orange-500";

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function performSearch() {
      if (user) {
        // User Search
        return;
      }

      if (!name && !set && !number) return;
      
      setLoading(true);
      try {
        if (activeGame === "mtg") {
          // Scryfall API
          let query = "";
          if (name) query += `${name} `; // Scryfall does fuzzy search natively without quotes
          if (set) query += `set:${set} `;
          if (number) query += `cn:${number} `;
          
          const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query.trim())}`);
          const data = await res.json();
          if (data.data) {
            setResults(data.data.map((c: any) => ({
              id: c.id,
              name: c.name,
              setName: c.set_name,
              image: c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal,
              number: c.collector_number
            })));
          }
        } else if (activeGame === "pokemon") {
          // Pokemon TCG API
          let query = "";
          if (name) {
            // Pokémon API supports wildcards like name:charizard*
            const safeName = name.replace(/[^a-zA-Z0-9 ]/g, ''); // strip special chars for safety
            query += `name:${safeName.split(' ').join('* ')}* `; 
          }
          if (set) query += `set.id:${set}* `; 
          if (number) query += `number:${number} `;
          
          const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query.trim())}`);
          const data = await res.json();
          if (data.data) {
            setResults(data.data.map((c: any) => ({
              id: c.id,
              name: c.name,
              setName: c.set.name,
              image: c.images.small,
              number: c.number
            })));
          }
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    
    performSearch();
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
        <div className="text-center text-neutral-500 font-serif italic py-12">Scouring the archives...</div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.map((card) => (
            <div key={card.id} className="group relative">
              <div className="relative aspect-[63/88] rounded-xl overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors mb-3">
                {card.image ? (
                  <Image src={card.image} alt={card.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-500 font-serif text-xs">No Image</div>
                )}
              </div>
              <h3 className="font-serif text-white text-sm truncate">{card.name}</h3>
              <p className="font-sans text-[9px] uppercase tracking-widest text-neutral-500 truncate">{card.setName} • #{card.number}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center flex flex-col items-center justify-center opacity-50">
          <p className="font-serif text-2xl text-neutral-400 mb-2">No Results Found</p>
          <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500">
            Try adjusting your search parameters.
          </p>
        </div>
      )}
    </main>
  );
}
