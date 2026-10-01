"use client";

import { useEffect, useState, use } from "react";
import { getAuctionDetails, placeBid } from "@/app/actions/auction";
import { proxiedImage } from "@/lib/images";
import { getCurrentUser } from "@/app/actions/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [isBidding, setIsBidding] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const userRes = await getCurrentUser();
      setCurrentUser(userRes);

      const res = await getAuctionDetails(resolvedParams.id);
      if (res.success) {
        setAuction(res.auction);
        if (res.auction) {
          const nextBid = res.auction.currentPrice + 1;
          setBidAmount(nextBid.toString());
        }
      }
      setLoading(false);
    }
    load();
  }, [resolvedParams.id]);

  async function handleBid(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) {
      router.push("/login");
      return;
    }

    setIsBidding(true);
    setError("");
    
    const amount = parseFloat(bidAmount);
    const res = await placeBid(resolvedParams.id, amount);
    
    if (res.success) {
      // Reload auction details
      const detailsRes = await getAuctionDetails(resolvedParams.id);
      if (detailsRes.success && detailsRes.auction) {
        setAuction(detailsRes.auction);
        setBidAmount((detailsRes.auction.currentPrice + 1).toString());
      }
    } else {
      setError(res.error || "Failed to place bid");
    }
    
    setIsBidding(false);
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-12 text-center text-neutral-400">Loading auction details...</div>;
  }

  if (!auction) {
    return <div className="container mx-auto px-4 py-12 text-center text-neutral-400">Auction not found.</div>;
  }

  const isSeller = currentUser?.id === auction.sellerId;
  const isEnded = new Date(auction.endTime) < new Date() || auction.status !== "ACTIVE";
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/auctions" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">
        &larr; Back to Auctions
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8">
        <div className="bg-black rounded-xl p-8 flex items-center justify-center min-h-[400px]">
          <img
            src={proxiedImage(auction.CardInstance.Card.imageUrl) || "/placeholder.png"}
            alt={auction.CardInstance.Card.name}
            className="max-w-full max-h-[500px] object-contain"
          />
        </div>
        
        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">{auction.CardInstance.Card.name}</h1>
            <p className="text-neutral-400">
              Condition: <span className="text-white capitalize">{auction.CardInstance.condition.replace(/_/g, " ").toLowerCase()}</span>
            </p>
          </div>
          
          <div className="bg-neutral-800/50 rounded-xl p-6 mb-8 border border-neutral-700/50">
            <div className="flex justify-between items-end mb-6 pb-6 border-b border-neutral-700">
              <div>
                <p className="text-sm text-neutral-400 mb-1">Current Bid</p>
                <p className="text-4xl font-bold text-green-400">${auction.currentPrice.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-400 mb-1">Ends In</p>
                <p className="text-lg font-semibold text-white">
                  {isEnded ? "Ended" : new Date(auction.endTime).toLocaleString()}
                </p>
              </div>
            </div>
            
            {auction.buyItNowPrice && (
              <div className="mb-6 flex justify-between items-center">
                <span className="text-neutral-400">Buy It Now Price:</span>
                <span className="text-xl font-bold text-white">${auction.buyItNowPrice.toFixed(2)}</span>
              </div>
            )}
            
            {!isSeller && !isEnded && (
              <form onSubmit={handleBid}>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min={auction.currentPrice + 0.01}
                      required
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-3 pl-8 pr-4 text-white text-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isBidding}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-8 font-bold rounded-lg transition"
                  >
                    {isBidding ? "Placing..." : "Place Bid"}
                  </button>
                </div>
                {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
              </form>
            )}
            
            {isSeller && (
              <div className="text-blue-400 text-sm bg-blue-900/20 p-4 rounded-lg">
                You are the seller of this item. You cannot bid on your own auction.
              </div>
            )}
            
            {isEnded && (
              <div className="text-yellow-400 text-sm bg-yellow-900/20 p-4 rounded-lg">
                This auction has ended.
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Bid History</h3>
            {auction.Bids.length === 0 ? (
              <p className="text-neutral-500 italic">No bids yet. Be the first!</p>
            ) : (
              <div className="space-y-3">
                {auction.Bids.map((bid: any) => (
                  <div key={bid.id} className="flex justify-between items-center bg-neutral-800/30 p-3 rounded-lg border border-neutral-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-700 overflow-hidden">
                        {bid.Bidder.avatarUrl && (
                          <img src={bid.Bidder.avatarUrl} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{bid.Bidder.username}</p>
                        <p className="text-xs text-neutral-500">{new Date(bid.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-green-400 font-bold">
                      ${bid.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
