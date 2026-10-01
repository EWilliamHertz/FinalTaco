
"use client";
import { useState } from "react";
import { toggleFollow } from "@/app/actions/user";
import { toast } from "react-toastify";

export default function FollowButton({ targetUserId, initialFollowed }: { targetUserId: string, initialFollowed: boolean }) {
  const [followed, setFollowed] = useState(initialFollowed);
  const [loading, setLoading] = useState(false);

  return (
    <button 
      onClick={async () => {
        setLoading(true);
        const res = await toggleFollow(targetUserId);
        if (res.success) setFollowed(res.followed as boolean);
        else toast.error(res.error);
        setLoading(false);
      }}
      disabled={loading}
      className={`px-6 py-2 rounded-full font-sans text-[10px] uppercase tracking-widest transition-colors ${followed ? 'bg-white/10 text-white border border-white/20' : 'bg-white text-black hover:bg-neutral-200'}`}
    >
      {loading ? "..." : followed ? "Following" : "Follow"}
    </button>
  );
}
