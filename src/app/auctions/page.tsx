"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getActiveAuctions, getUserCardsForAuction, createAuction } from "@/app/actions/auction";
import { proxiedImage } from "@/lib/images";

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [myCards, setMyCards] = useState<any[]>([]);
  
  // Form state
  const [selectedCardId, setSelectedCardId] = useState("");
  const [startPrice, setStartPrice] = useState("");
  const [binPrice, setBinPrice] = useState("");
  const [duration, setDuration] = useState("24");

  useEffect(() => {
    async function load() {
      const res = await getActiveAuctions();
      if (res.success) {
        setAuctions(res.auctions || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function loadMyCards() {
    const res = await getUserCardsForAuction();
    if (res.success) {
      setMyCards(res.cards || []);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCardId) return;
    
    const sPrice = parseFloat(startPrice);
    const bPrice = binPrice ? parseFloat(binPrice) : null;
    const dur = parseInt(duration);
    
    const res = await createAuction(selectedCardId, sPrice, bPrice, dur);
    if (res.success) {
      setShowCreate(false);
      // reload auctions
      const actRes = await getActiveAuctions();
      if (actRes.success) setAuctions(actRes.auctions || []);
    } else {
      alert(res.error);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Active Auctions</h1>
        <button
          onClick={() => {
            setShowCreate(true);
            loadMyCards();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          Start Auction
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Create Auction</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Select Card</label>
                <select
                  required
                  value={selectedCardId}
                  onChange={(e) => setSelectedCardId(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white"
                >
                  <option value="">-- Choose a card --</option>
                  {myCards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.Card.name} ({c.condition})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Starting Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={startPrice}
                  onChange={(e) => setStartPrice(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Buy It Now Price ($) - Optional</label>
                <input
                  type="number"
                  step="0.01"
                  value={binPrice}
                  onChange={(e) => setBinPrice(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Duration (Hours)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white"
                >
                  <option value="12">12 Hours</option>
                  <option value="24">24 Hours</option>
                  <option value="48">48 Hours</option>
                  <option value="72">72 Hours</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-neutral-400">Loading auctions...</div>
      ) : auctions.length === 0 ? (
        <div className="text-neutral-400 py-12 text-center bg-neutral-900/50 rounded-xl border border-neutral-800">
          No active auctions right now. Be the first to start one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {auctions.map((auction) => (
            <Link key={auction.id} href={`/auctions/${auction.id}`}>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-blue-500/50 transition cursor-pointer group">
                <div className="aspect-[2.5/3.5] relative bg-black p-4">
                  <img
                    src={proxiedImage(auction.CardInstance.Card.imageUrl) || "/placeholder.png"}
                    alt={auction.CardInstance.Card.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="p-4">
                  <div className="text-xs text-blue-400 font-medium mb-1">
                    Ends {new Date(auction.endTime).toLocaleDateString()}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 truncate">
                    {auction.CardInstance.Card.name}
                  </h3>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-400">Current Bid</span>
                    <span className="text-green-400 font-bold">${auction.currentPrice.toFixed(2)}</span>
                  </div>
                  {auction.buyItNowPrice && (
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-neutral-400">Buy It Now</span>
                      <span className="text-white">${auction.buyItNowPrice.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-neutral-800 overflow-hidden">
                      {auction.Seller.avatarUrl && (
                        <img src={auction.Seller.avatarUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <span className="text-xs text-neutral-400">{auction.Seller.username}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
