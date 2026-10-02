"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Image from "next/image";
import { proxiedImage } from "@/lib/images";
import { Send, CheckCircle2, XCircle } from "lucide-react";
import { updateTradeStatus } from "@/app/actions/trade";
import { toast } from "react-toastify";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export default function LiveTradeRoom({ trade: initialTrade, currentUser }: { trade: any, currentUser: any }) {
  const [trade, setTrade] = useState(initialTrade);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<Socket | null>(null);

  const isSender = trade.senderId === currentUser.id;
  const partner = isSender ? trade.Receiver : trade.Sender;

  useEffect(() => {
    // Connect to the custom WS server on port 3001
    const socket = io("http://localhost:3001");
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_trade", trade.id);
    });

    socket.on("chat_message", (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on("trade_updated", (updatedTrade) => {
      setTrade(updatedTrade);
      toast.info("Trade was updated by the other party.");
    });

    return () => {
      socket.disconnect();
    };
  }, [trade.id]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;
    
    const msg: Message = {
      id: Math.random().toString(36).substring(7),
      senderId: currentUser.id,
      text: input,
      timestamp: Date.now(),
    };

    // Optimistic UI update
    setMessages(prev => [...prev, msg]);
    
    // Broadcast to partner
    socketRef.current.emit("chat_message", { tradeId: trade.id, ...msg });
    setInput("");
  };

  const handleAction = async (status: 'ACCEPTED' | 'DECLINED') => {
    const res = await updateTradeStatus(trade.id, status);
    if (res.success) {
      const updated = { ...trade, status };
      setTrade(updated);
      toast.success(`Trade ${status.toLowerCase()}!`);
      // Notify partner
      socketRef.current?.emit("trade_updated", updated);
    } else {
      toast.error(res.error);
    }
  };

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 lg:px-12 max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-8">
      {/* Left side: Trade state */}
      <div className="flex-1 flex flex-col gap-8">
        <div className="border-b border-white/10 pb-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl text-white uppercase tracking-widest mb-2">
              Live Trade Room
            </h1>
            <p className="font-sans text-[10px] text-neutral-400 uppercase tracking-[0.2em]">
              Negotiating with {partner.username}
            </p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-xs uppercase font-sans tracking-widest ${
            trade.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
            trade.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            'bg-red-500/20 text-red-500 border border-red-500/30'
          }`}>
            {trade.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* You Offered */}
          <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-2xl">
            <h3 className="font-sans text-xs uppercase tracking-widest text-neutral-400 mb-6 text-center border-b border-white/5 pb-4">
              {isSender ? "You Offered" : "They Offered"}
            </h3>
            <div className="flex flex-wrap gap-4 justify-center">
              {trade.OfferedItems.map((item: any) => (
                <div key={item.id} className="w-24 h-36 relative rounded-lg overflow-hidden border border-white/10 group">
                  {item.Instance.Card.imageUrl ? (
                    <Image src={proxiedImage(item.Instance.Card.imageUrl)!} alt="card" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-black/50 text-[10px] flex items-center justify-center p-2 text-center">No Image</div>
                  )}
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[10px] flex flex-col justify-center text-center">
                    <span className="text-white mb-2">{item.Instance.Card.name}</span>
                    <span className="text-emerald-400">${item.Instance.customPrice || item.Instance.Card.marketPrice.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* You Requested */}
          <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-2xl">
            <h3 className="font-sans text-xs uppercase tracking-widest text-neutral-400 mb-6 text-center border-b border-white/5 pb-4">
              {isSender ? "You Requested" : "They Requested"}
            </h3>
            <div className="flex flex-wrap gap-4 justify-center">
              {trade.RequestedItems.map((item: any) => (
                <div key={item.id} className="w-24 h-36 relative rounded-lg overflow-hidden border border-white/10 group">
                  {item.Instance.Card.imageUrl ? (
                    <Image src={proxiedImage(item.Instance.Card.imageUrl)!} alt="card" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-black/50 text-[10px] flex items-center justify-center p-2 text-center">No Image</div>
                  )}
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[10px] flex flex-col justify-center text-center">
                    <span className="text-white mb-2">{item.Instance.Card.name}</span>
                    <span className="text-emerald-400">${item.Instance.customPrice || item.Instance.Card.marketPrice.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {trade.status === 'PENDING' && !isSender && (
          <div className="flex justify-end gap-4 mt-4">
            <button
              onClick={() => handleAction('DECLINED')}
              className="flex items-center gap-2 px-6 py-3 border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors rounded-xl font-sans text-xs uppercase tracking-widest"
            >
              <XCircle size={16} /> Decline
            </button>
            <button
              onClick={() => handleAction('ACCEPTED')}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors rounded-xl font-sans text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/10"
            >
              <CheckCircle2 size={16} /> Accept Trade
            </button>
          </div>
        )}
        
        {trade.status === 'PENDING' && isSender && (
          <div className="flex justify-end gap-4 mt-4">
            <button
              onClick={() => handleAction('DECLINED')}
              className="flex items-center gap-2 px-6 py-3 border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors rounded-xl font-sans text-xs uppercase tracking-widest"
            >
              <XCircle size={16} /> Cancel Offer
            </button>
          </div>
        )}
      </div>

      {/* Right side: Live Chat */}
      <div className="w-full lg:w-96 flex flex-col bg-neutral-900/60 border border-white/5 rounded-3xl overflow-hidden h-[600px] shadow-2xl">
        <div className="p-4 bg-black/40 border-b border-white/5 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
          <h3 className="font-serif text-white">Live Negotiation</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
              <p className="font-serif text-sm text-neutral-400 mb-1">No messages yet</p>
              <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500">Say hello and start negotiating</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.senderId === currentUser.id;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] uppercase tracking-widest text-neutral-500 mb-1 px-1">
                    {isMe ? 'You' : partner.username}
                  </span>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] ${
                    isMe 
                      ? 'bg-purple-600 text-white rounded-tr-sm' 
                      : 'bg-neutral-800 border border-white/5 text-neutral-200 rounded-tl-sm'
                  }`}>
                    <p className="text-sm font-sans">{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={sendMessage} className="p-4 bg-black/40 border-t border-white/5">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              disabled={trade.status !== 'PENDING'}
              className="w-full bg-neutral-900 border border-white/10 rounded-full px-5 py-3 pr-12 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || trade.status !== 'PENDING'}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-purple-500/20 disabled:hover:text-purple-400"
            >
              <Send size={14} />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
