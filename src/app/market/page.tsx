"use client";

import React, { useEffect, useState } from "react";
import { useGameStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Image from "next/image";
import { getMarketplaceListings } from "@/app/actions/market";
import Link from "next/link";

export default function MarketPage() {
  const activeGame = useGameStore((state) => state.activeGame);
  const [viewMode, setViewMode] = useState<"cards" | "sealed">("cards");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (activeGame) {
      setLoading(true);
      getMarketplaceListings(activeGame).then(data => {
        setListings(data);
        setLoading(false);
      });
    }
  }, [activeGame]);

  if (!activeGame) return null;

  const brandColor = activeGame === "pokemon" ? "text-yellow-400" : "text-orange-500";
  const hoverBorder = activeGame === "pokemon" ? "hover:border-yellow-400/30" : "hover:border-orange-500/30";

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 lg:px-12 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 border-b border-white/10 pb-8">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl text-white font-light uppercase tracking-widest mb-3">
            The <span className={brandColor}>Exchange</span>
          </h1>
          <p className="font-sans text-neutral-400 text-sm tracking-[0.2em] uppercase">
            Trades & Sales
          </p>
        </div>

        <div className="relative flex flex-col items-end gap-4">
          <div className="flex items-center gap-4 border border-white/10 p-1 rounded-lg bg-neutral-900/50">
            <button 
              onClick={() => setViewMode("cards")}
              className={`px-4 py-2 rounded font-sans text-[10px] uppercase tracking-widest transition-colors ${viewMode === "cards" ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}
            >
              Singles
            </button>
            <button 
              onClick={() => setViewMode("sealed")}
              className={`px-4 py-2 rounded font-sans text-[10px] uppercase tracking-widest transition-colors ${viewMode === "sealed" ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}
            >
              Sealed Product
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input 
              type="text" 
              placeholder={viewMode === "cards" ? "Search the market..." : "Search sealed market..."}
              className={`bg-transparent border-b border-white/20 pl-10 pr-4 py-2 text-sm text-white focus:outline-none transition-colors w-64 md:w-80 font-serif italic ${activeGame === "pokemon" ? "focus:border-yellow-400" : "focus:border-orange-500"}`}
            />
          </div>
        </div>
      </div>

      <div className="w-full">
        {viewMode === "sealed" ? (
          <div className="py-20 text-center flex flex-col items-center justify-center opacity-50">
            <p className="font-serif text-2xl text-neutral-400 mb-2">No Sealed Listings</p>
            <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500">The sealed marketplace is currently empty.</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-white/5 text-[10px] font-sans tracking-[0.2em] uppercase text-neutral-500">
          <div className="col-span-5">Asset / Provenance</div>
          <div className="col-span-2">Condition</div>
          <div className="col-span-2">Curator</div>
          <div className="col-span-2 text-right">Valuation</div>
          <div className="col-span-1 text-right">Trend</div>
        </div>

        {/* Table Body */}
        <div className="flex flex-col">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <p className="font-serif text-2xl text-neutral-500 italic">Fetching market data...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center opacity-50">
              <p className="font-serif text-2xl text-neutral-400 mb-2">Marketplace is Empty</p>
              <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500">No active listings available.</p>
            </div>
          ) : (
            listings.map((item, i) => {
              const isPokemon = activeGame === "pokemon" || (activeGame === "both" && item.CardInstance.Card.game === "POKEMON");
              const brandColorLocal = isPokemon ? "text-yellow-400" : "text-orange-500";
              const marketPrice = item.CardInstance.Card.marketPrice;
              const trend = marketPrice ? (marketPrice - item.price) : 0;
              
              return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                key={item.id}
                className={`group grid grid-cols-1 md:grid-cols-12 gap-4 py-6 border-b border-white/5 bg-transparent hover:bg-neutral-900/30 transition-colors items-center cursor-pointer`}
              >
                <div className="col-span-1 md:col-span-5 flex items-center gap-6">
                  <div className={`relative w-16 h-20 overflow-hidden border border-white/10 shrink-0 ${isPokemon ? "hover:border-yellow-400/30" : "hover:border-orange-500/30"}`}>
                    {item.CardInstance.Card.imageUrl ? (
                      <Image src={item.CardInstance.Card.imageUrl} alt={item.CardInstance.Card.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700 grayscale group-hover:grayscale-0" unoptimized />
                    ) : (
                      <div className="w-full h-full bg-neutral-900 flex items-center justify-center">No Img</div>
                    )}
                  </div>
                  <div>
                    <h3 className={`font-serif text-lg text-neutral-200 transition-colors ${isPokemon ? "group-hover:text-yellow-400" : "group-hover:text-orange-500"}`}>{item.CardInstance.Card.name}</h3>
                    <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 mt-1">{item.CardInstance.Card.setName} {item.CardInstance.Card.number && `• #${item.CardInstance.Card.number}`}</p>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 flex justify-between md:block">
                  <span className="md:hidden text-[10px] font-sans tracking-[0.2em] uppercase text-neutral-500">Condition</span>
                  <span className="font-serif text-neutral-300">{item.CardInstance.condition.replace(/_/g, " ")}</span>
                </div>

                <div className="col-span-1 md:col-span-2 flex justify-between md:block">
                  <span className="md:hidden text-[10px] font-sans tracking-[0.2em] uppercase text-neutral-500">Curator</span>
                  <Link href={`/profile/${item.Seller.username}`} className="font-sans text-sm text-neutral-400 font-light hover:text-white transition-colors">{item.Seller.username}</Link>
                </div>

                <div className="col-span-1 md:col-span-2 flex justify-between md:block md:text-right">
                  <span className="md:hidden text-[10px] font-sans tracking-[0.2em] uppercase text-neutral-500">Valuation</span>
                  <span className={`font-serif text-lg ${brandColorLocal}`}>${item.price.toFixed(2)}</span>
                </div>

                <div className="col-span-1 md:col-span-1 flex justify-between md:justify-end items-center">
                  <span className="md:hidden text-[10px] font-sans tracking-[0.2em] uppercase text-neutral-500">Trend</span>
                  <div className="flex items-center gap-1">
                    {marketPrice > 0 ? (
                      <>
                        <span className={`font-sans text-xs ${trend >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                          {trend >= 0 ? '+' : '-'}${Math.abs(trend).toFixed(2)}
                        </span>
                        {trend >= 0 ? (
                          <ArrowUpRight size={14} className="text-emerald-500/80" />
                        ) : (
                          <ArrowDownRight size={14} className="text-rose-500/80" />
                        )}
                      </>
                    ) : (
                      <span className="font-sans text-xs text-neutral-500">N/A</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )})
          )}
        </div>
          </>
        )}
      </div>
    </main>
  );
}
