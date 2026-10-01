"use client";

import { markAsRead } from "@/app/actions/notification";
import Link from "next/link";
import { useState } from "react";
import { Bell, Heart, MessageCircle, UserPlus, RefreshCw, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function NotificationClient({ initialNotifications }: { initialNotifications: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleMarkAll = async () => {
    setLoading(true);
    await markAsRead();
    setLoading(false);
  };

  const handleRead = async (id: string, link?: string) => {
    await markAsRead(id);
    if (link) {
      router.push(link);
    }
  };

  if (initialNotifications.length === 0) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center opacity-50">
        <Bell className="w-12 h-12 text-neutral-500 mb-4" />
        <p className="font-serif text-2xl text-neutral-400 mb-2">All Caught Up</p>
        <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500">No new notifications</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "LIKE": return <Heart className="w-4 h-4 text-pink-500" />;
      case "COMMENT": return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case "FOLLOW": return <UserPlus className="w-4 h-4 text-emerald-500" />;
      case "TRADE": return <RefreshCw className="w-4 h-4 text-yellow-500" />;
      default: return <AlertCircle className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={handleMarkAll}
          disabled={loading}
          className="font-sans text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-3">
        {initialNotifications.map(notif => (
          <div 
            key={notif.id}
            onClick={() => handleRead(notif.id, notif.link)}
            className={`p-4 rounded-xl border transition-colors flex items-center gap-4 cursor-pointer ${notif.read ? 'bg-neutral-900/30 border-white/5 opacity-70' : 'bg-neutral-900/80 border-white/20'}`}
          >
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0 border border-white/10">
              {getIcon(notif.type)}
            </div>
            <div className="flex-1">
              <p className={`font-serif text-sm ${notif.read ? 'text-neutral-400' : 'text-white'}`}>{notif.content}</p>
              <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 mt-1">
                {new Date(notif.createdAt).toLocaleDateString()}
              </p>
            </div>
            {!notif.read && (
              <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
