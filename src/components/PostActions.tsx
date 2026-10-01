"use client";

import { useState, useEffect } from "react";
import { editPost, deletePost } from "@/app/actions/post";
import { getCurrentUser } from "@/app/actions/auth";
import { toast } from "react-toastify";

export function PostActions({ postId, authorId, initialContent }: { postId: string, authorId: string, initialContent: string }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(initialContent);

  useEffect(() => {
    getCurrentUser().then(setCurrentUser);
  }, []);

  if (!currentUser) return null;
  if (currentUser.id !== authorId && currentUser.role !== "ADMIN") return null;

  return (
    <>
      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={() => setIsEditing(true)} className="p-1.5 bg-black/50 hover:bg-white text-neutral-400 hover:text-black rounded transition-colors backdrop-blur-md border border-white/10">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        </button>
        <button onClick={async () => {
          if (confirm("Delete this post?")) {
            const res = await deletePost(postId);
            if (res.success) {
              toast.success("Post deleted");
              window.location.reload();
            } else toast.error(res.error);
          }
        }} className="p-1.5 bg-black/50 hover:bg-rose-500 text-neutral-400 hover:text-white rounded transition-colors backdrop-blur-md border border-white/10">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>

      {isEditing && (
        <div className="absolute inset-0 z-20 bg-neutral-900 p-5 flex flex-col">
          <textarea 
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="flex-1 w-full bg-black/50 text-white font-serif resize-none focus:outline-none border border-white/20 p-3 rounded-lg text-sm mb-3"
          />
          <div className="flex gap-2 mt-auto">
            <button onClick={async () => {
              const res = await editPost(postId, editContent);
              if (res.success) {
                toast.success("Post updated");
                window.location.reload();
              } else toast.error(res.error);
            }} className="flex-1 py-2 bg-white text-black text-[10px] uppercase tracking-widest rounded-lg">Save</button>
            <button onClick={() => setIsEditing(false)} className="flex-1 py-2 border border-white/20 text-white text-[10px] uppercase tracking-widest rounded-lg hover:bg-white/5">Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
