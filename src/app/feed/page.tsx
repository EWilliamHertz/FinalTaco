"use client";
import { toast } from "react-toastify";

import { useEffect, useState, useRef, useCallback } from "react";
import { getPosts, createPost, toggleLike, addComment, editPost, deletePost } from "@/app/actions/post";
import { getCurrentUser } from "@/app/actions/auth";
import { Heart, MessageCircle, Share2, Plus, ImageIcon, UploadCloud } from "lucide-react";
import Image from "next/image";
import { useGameStore } from "@/lib/store";
import { motion } from "framer-motion";
import Link from "next/link";

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  
  // Pagination
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedType, setFeedType] = useState<"GLOBAL" | "FOLLOWING">("GLOBAL");
  
  const TAKE = 12;

  const formRef = useRef<HTMLFormElement>(null);
  const activeGame = useGameStore((state) => state.activeGame);
  
  const brandColor = activeGame === "pokemon" ? "text-yellow-400" : "text-orange-500";
  const hoverText = activeGame === "pokemon" ? "hover:text-yellow-400" : "hover:text-orange-500";
  const buttonBg = activeGame === "pokemon" ? "bg-yellow-400 text-black hover:bg-yellow-300" : "bg-orange-500 text-black hover:bg-orange-400";
  const hoverBorder = activeGame === "pokemon" ? "hover:border-yellow-400/30" : "hover:border-orange-500/30";

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    const user = await getCurrentUser();
    setCurrentUser(user);
    const initialPosts = await getPosts(0, TAKE, feedType);
    setPosts(initialPosts);
    setHasMore(initialPosts.length === TAKE);
    setSkip(TAKE);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial, feedType]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const morePosts = await getPosts(skip, TAKE, feedType);
    if (morePosts.length > 0) {
      setPosts(prev => [...prev, ...morePosts]);
      setSkip(prev => prev + TAKE);
    }
    if (morePosts.length < TAKE) {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  const handlePost = async (formData: FormData) => {
    setIsPosting(true);
    if (selectedImage) {
      formData.append("imageFile", selectedImage);
    }
    
    const res = await createPost(formData);
    if (res.success) {
      formRef.current?.reset();
      setSelectedImage(null);
      await fetchInitial();
    } else {
      toast.error(res.error);
    }
    setIsPosting(false);
  };

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 lg:px-12 max-w-[1400px] mx-auto">
      <div className="mb-12 flex flex-col items-center justify-center space-y-4">
        <h1 className="font-serif text-4xl md:text-5xl text-white font-light uppercase tracking-widest">
          The <span className={brandColor}>Feed</span>
        </h1>
        <p className="font-sans text-neutral-400 text-sm tracking-[0.2em] uppercase">
          Discover {activeGame === "pokemon" ? "Pokémon" : "MTG"} Collections
        </p>
      </div>

      
      <div className="flex justify-center mb-12">
        <div className="bg-neutral-900/50 border border-white/10 rounded-full p-1 flex">
          <button 
            onClick={() => { setFeedType("GLOBAL"); setSkip(0); }}
            className={`px-6 py-2 rounded-full font-sans text-[10px] uppercase tracking-widest transition-colors ${feedType === "GLOBAL" ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}
          >
            Global Feed
          </button>
          <button 
            onClick={() => { setFeedType("FOLLOWING"); setSkip(0); }}
            className={`px-6 py-2 rounded-full font-sans text-[10px] uppercase tracking-widest transition-colors ${feedType === "FOLLOWING" ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}
          >
            Following
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto mb-16">
        <form ref={formRef} action={handlePost} className="bg-neutral-900/50 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
          <textarea 
            name="content"
            placeholder="Share a pull, a deck, or a thought..."
            className="w-full bg-transparent text-white font-serif resize-none focus:outline-none placeholder:text-neutral-600 mb-4"
            rows={3}
            required={!selectedImage}
          />
          {selectedImage && (
            <div className="mb-4 text-xs font-sans text-emerald-400 flex items-center gap-2 bg-emerald-500/10 p-2 rounded">
              <UploadCloud size={14} /> {selectedImage.name} attached
              <button type="button" onClick={() => setSelectedImage(null)} className="ml-auto hover:text-white">&times; Remove</button>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <div className="flex gap-4">
              <label className="cursor-pointer text-neutral-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5 flex items-center gap-2">
                <ImageIcon size={18} />
                <span className="text-[10px] uppercase font-sans tracking-widest hidden sm:inline">Upload Image</span>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                  className="hidden" 
                />
              </label>
              </div>
            <button 
              type="submit" 
              disabled={isPosting}
              className={`px-6 py-2 rounded-full font-sans text-xs uppercase tracking-widest transition-colors flex items-center gap-2 ${buttonBg} disabled:opacity-50`}
            >
              <Plus size={14} /> {isPosting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center font-serif text-neutral-500 italic">Loading feed...</div>
        ) : posts.length === 0 ? (
          <div className="col-span-full py-32 text-center flex flex-col items-center justify-center opacity-50">
            <p className="font-serif text-3xl text-neutral-400 mb-3">The Feed is Empty</p>
            <p className="font-sans text-xs uppercase tracking-widest text-neutral-500">Be the first to post.</p>
          </div>
        ) : (
          posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i % TAKE) * 0.1, duration: 0.8, ease: "easeOut" }}
              className={`relative group rounded-2xl overflow-hidden bg-neutral-900/50 border border-white/5 ${hoverBorder} transition-colors duration-500 backdrop-blur-sm flex flex-col`}
            >

              {currentUser && (currentUser.id === post.authorId || currentUser.role === "ADMIN") && (
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => {
                    setEditingPostId(post.id);
                    setEditContent(post.content);
                  }} className="p-1.5 bg-black/50 hover:bg-white text-neutral-400 hover:text-black rounded transition-colors backdrop-blur-md border border-white/10">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={async () => {
                    if (confirm("Delete this post?")) {
                      const res = await deletePost(post.id);
                      if (res.success) {
                        toast.success("Post deleted");
                        setPosts(prev => prev.filter(p => p.id !== post.id));
                      } else toast.error(res.error);
                    }
                  }} className="p-1.5 bg-black/50 hover:bg-rose-500 text-neutral-400 hover:text-white rounded transition-colors backdrop-blur-md border border-white/10">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              )}
              <div className="p-5 border-b border-white/5 flex items-center gap-3">
                <Link href={`/profile/${post.Author.username}`} className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-neutral-800 flex items-center justify-center cursor-pointer">
                  {post.Author.avatarUrl ? (
                    <img src={post.Author.avatarUrl} alt={post.Author.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-neutral-400 font-serif">{post.Author.username.slice(0,3).toUpperCase()}</span>
                  )}
                </Link>
                <div>
                  <Link href={`/profile/${post.Author.username}`} className="font-sans text-xs text-white font-medium uppercase tracking-widest hover:text-emerald-400 transition-colors">
                    {post.Author.username}
                  </Link>
                  <span className="block font-serif text-[10px] text-neutral-500">{new Date(post.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              </div>

              {post.images && post.images.length > 0 && (
                <div className="relative">
                  <Image
                    src={post.images[0]}
                    alt={`Post by ${post.Author.username}`}
                    width={600}
                    height={800}
                    className="w-full h-auto object-cover transition-transform duration-700 ease-out"
                   
                  />
                </div>
              )}
              
              <div className="p-5 flex-1 flex flex-col">
                
                {editingPostId === post.id ? (
                  <div className="mb-4">
                    <textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-black/50 text-white font-serif resize-none focus:outline-none border border-white/20 p-2 rounded-lg text-sm"
                      rows={3}
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={async () => {
                        const res = await editPost(post.id, editContent);
                        if (res.success) {
                          setPosts(prev => prev.map(p => p.id === post.id ? { ...p, content: editContent } : p));
                          setEditingPostId(null);
                          toast.success("Post updated");
                        } else toast.error(res.error);
                      }} className="px-3 py-1 bg-white text-black text-[10px] uppercase tracking-widest rounded">Save</button>
                      <button onClick={() => setEditingPostId(null)} className="px-3 py-1 border border-white/20 text-white text-[10px] uppercase tracking-widest rounded hover:bg-white/5">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="font-serif text-neutral-300 text-sm mb-4">{post.content}</p>
                )}

                
                <div className="flex items-center gap-4 text-neutral-400 mb-4 mt-auto">
                  <button 
                    onClick={async () => {
                      await toggleLike(post.id);
                      const updated = await getPosts(0, skip);
                      setPosts(updated);
                    }}
                    className={`flex items-center gap-1.5 transition-colors ${post.hasLiked ? brandColor : hoverText}`}
                  >
                    <Heart size={18} strokeWidth={1.5} className={post.hasLiked ? "fill-current" : ""} />
                    <span className="text-xs">{post.likes}</span>
                  </button>
                  <button 
                    onClick={() => {
                      const el = document.getElementById(`comment-form-${post.id}`);
                      if (el) {
                        el.classList.toggle('hidden');
                        el.querySelector('input')?.focus();
                      }
                    }}
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <MessageCircle size={18} strokeWidth={1.5} />
                    <span className="text-xs">{post.Comments?.length || 0}</span>
                  </button>
                </div>

                <div className="space-y-3 mt-4 border-t border-white/5 pt-4">
                  {post.Comments?.map((comment: any) => (
                    <div key={comment.id} className="flex gap-2 items-start">
                      <Link href={`/profile/${comment.Author.username}`} className="font-sans text-[10px] font-bold text-white uppercase hover:text-emerald-400 transition-colors">
                        {comment.Author.username}
                      </Link>
                      <span className="font-serif text-xs text-neutral-300">{comment.content}</span>
                    </div>
                  ))}
                  
                  <form 
                    id={`comment-form-${post.id}`} 
                    className="hidden mt-2 flex gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const input = form.elements.namedItem('content') as HTMLInputElement;
                      if (!input.value.trim()) return;
                      await addComment(post.id, input.value);
                      form.reset();
                      const updated = await getPosts(0, skip);
                      setPosts(updated);
                    }}
                  >
                    <input 
                      type="text" 
                      name="content" 
                      placeholder="Add a comment..." 
                      className="flex-1 bg-transparent border-b border-white/10 text-xs text-white px-0 py-1 focus:outline-none focus:border-white/40 font-serif"
                    />
                    <button type="submit" className="text-[10px] font-sans uppercase tracking-widest text-neutral-400 hover:text-white">Post</button>
                  </form>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {posts.length > 0 && hasMore && (
        <div className="mt-16 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-8 py-3 border border-white/20 hover:border-white text-neutral-400 hover:text-white rounded-full font-sans text-xs uppercase tracking-widest transition-all bg-neutral-900/50 backdrop-blur-sm disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load More Posts"}
          </button>
        </div>
      )}
    </main>
  );
}
