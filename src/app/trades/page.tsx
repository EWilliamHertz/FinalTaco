import { getTrades, updateTradeStatus } from "@/app/actions/trade";
import { getCurrentUser } from "@/app/actions/auth";
import { notFound } from "next/navigation";
import Image from "next/image";
import { proxiedImage } from "@/lib/images";
import Link from "next/link";
import { TradeActionClient } from "./TradeActionClient";

export default async function TradesPage() {
  const user = await getCurrentUser();
  if (!user) return notFound();

  const res = await getTrades();
  const trades = res.trades || [];

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 lg:px-12 max-w-[1200px] mx-auto">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl text-white font-light uppercase tracking-widest mb-3">
            Trade <span className="text-purple-400">Center</span>
          </h1>
          <p className="font-sans text-neutral-400 text-sm tracking-[0.2em] uppercase">
            Manage your incoming and outgoing offers
          </p>
        </div>
        <Link href="/trades/new" className="px-8 py-3 bg-white text-black hover:bg-neutral-200 transition-colors rounded-lg font-sans text-xs uppercase tracking-widest flex items-center justify-center">
          Start Trade
        </Link>
      </div>

      {trades.length === 0 ? (
        <div className="py-32 text-center flex flex-col items-center justify-center opacity-50">
          <p className="font-serif text-3xl text-neutral-400 mb-3">No Active Trades</p>
          <p className="font-sans text-xs uppercase tracking-widest text-neutral-500">Go to a user's profile to propose a trade.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {trades.map(trade => {
            const isSender = trade.senderId === user.id;
            const partner = isSender ? trade.Receiver : trade.Sender;
            
            return (
              <div key={trade.id} className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden">
                      {partner.avatarUrl && <img src={partner.avatarUrl} alt={partner.username} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500">
                        {isSender ? "Sent to" : "Received from"}
                      </p>
                      <Link href={`/profile/${partner.username}`} className="font-serif text-white hover:text-purple-400 transition-colors">
                        {partner.username}
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-sans tracking-widest ${
                      trade.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' :
                      trade.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {trade.status}
                    </span>
                    <span className="font-sans text-[10px] uppercase tracking-widest text-neutral-500">
                      {new Date(trade.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-sans text-xs uppercase tracking-widest text-neutral-400 mb-4 text-center border-b border-white/5 pb-2">
                      {isSender ? "You Offered" : "They Offered"}
                    </h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {trade.OfferedItems.map(item => (
                        <div key={item.id} className="w-20 h-28 relative rounded-lg overflow-hidden border border-white/10 group">
                          {item.Instance.Card.imageUrl ? (
                            <Image src={proxiedImage(item.Instance.Card.imageUrl)!} alt="card" fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full bg-black/50 text-[8px] flex items-center justify-center p-1 text-center">No Image</div>
                          )}
                          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[8px] flex flex-col justify-center text-center">
                            <span className="text-white mb-1">{item.Instance.Card.name}</span>
                            <span className="text-emerald-400">${item.Instance.customPrice || item.Instance.Card.marketPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-sans text-xs uppercase tracking-widest text-neutral-400 mb-4 text-center border-b border-white/5 pb-2">
                      {isSender ? "You Requested" : "They Requested"}
                    </h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {trade.RequestedItems.map(item => (
                        <div key={item.id} className="w-20 h-28 relative rounded-lg overflow-hidden border border-white/10 group">
                          {item.Instance.Card.imageUrl ? (
                            <Image src={proxiedImage(item.Instance.Card.imageUrl)!} alt="card" fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full bg-black/50 text-[8px] flex items-center justify-center p-1 text-center">No Image</div>
                          )}
                          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[8px] flex flex-col justify-center text-center">
                            <span className="text-white mb-1">{item.Instance.Card.name}</span>
                            <span className="text-emerald-400">${item.Instance.customPrice || item.Instance.Card.marketPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {trade.status === 'PENDING' && (
                  <div className="mt-8 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <Link href={`/trades/${trade.id}`} className="flex items-center gap-2 px-6 py-3 bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 transition-colors rounded-lg font-sans text-[10px] uppercase tracking-widest">
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      Enter Live Room
                    </Link>
                    <TradeActionClient tradeId={trade.id} isSender={isSender} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
