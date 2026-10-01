"use client";

import { updateTradeStatus } from "@/app/actions/trade";
import { useState } from "react";
import { toast } from "react-toastify";

export function TradeActionClient({ tradeId, isSender }: { tradeId: string, isSender: boolean }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (status: "ACCEPTED" | "DECLINED" | "CANCELLED") => {
    setLoading(true);
    const res = await updateTradeStatus(tradeId, status);
    if (res.success) {
      toast.success(`Trade ${status.toLowerCase()}`);
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  };

  if (isSender) {
    return (
      <button 
        onClick={() => handleAction("CANCELLED")} 
        disabled={loading}
        className="px-6 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 font-sans text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50"
      >
        {loading ? "Processing..." : "Cancel Offer"}
      </button>
    );
  }

  return (
    <div className="flex gap-4">
      <button 
        onClick={() => handleAction("DECLINED")} 
        disabled={loading}
        className="px-6 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 font-sans text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50"
      >
        {loading ? "..." : "Decline"}
      </button>
      <button 
        onClick={() => handleAction("ACCEPTED")} 
        disabled={loading}
        className="px-6 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-sans text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50"
      >
        {loading ? "..." : "Accept Trade"}
      </button>
    </div>
  );
}
