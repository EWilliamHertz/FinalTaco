import { getUserProfile } from "@/app/actions/user";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import { PostActions } from "@/components/PostActions";
import ProfileVaultClient from "./ProfileVaultClient";
import FollowButton from "./FollowButton";
import { prisma } from "@/lib/db";

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const profile = await getUserProfile(params.username);
  if (!profile) {
    return notFound();
  }

  const { cookies } = await import("next/headers");
  const jwt = await import("jsonwebtoken");
  let currentUserId: string | null = null;
  try { 
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value; 
    if (token) { 
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "hatakesecret"); 
      currentUserId = decoded.userId; 
    } 
  } catch(e){}
  
  let isFollowing = false;
  if (currentUserId) {
    const f = await prisma.follows.findUnique({ 
      where: { followerId_followingId: { followerId: currentUserId, followingId: profile.id } } 
    });
    isFollowing = !!f;
  }

  return (
    <main className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16 border-b border-white/10 pb-12">
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-white/20 bg-neutral-900 flex items-center justify-center shrink-0">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl text-neutral-500 font-serif">{profile.username.slice(0,3).toUpperCase()}</span>
          )}
        </div>
        
        <div className="text-center md:text-left flex-1">
          <div className="flex items-center gap-4 mb-2"><h1 className="font-serif text-4xl text-white">{profile.username}</h1>{currentUserId && currentUserId !== profile.id && <FollowButton targetUserId={profile.id} initialFollowed={isFollowing} />}</div>
          <p className="font-sans text-xs uppercase tracking-widest text-neutral-400 mb-6">
            Joined {new Date(profile.createdAt).toLocaleDateString()}
          </p>
          
          <div className="flex items-center justify-center md:justify-start gap-8">
            <div className="flex flex-col items-center md:items-start">
              <span className="font-serif text-2xl text-white">{profile._count.CardInstances}</span>
              <span className="font-sans text-[9px] uppercase tracking-widest text-neutral-500">Vault Cards</span>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <span className="font-serif text-2xl text-white">{profile._count.Posts}</span>
              <span className="font-sans text-[9px] uppercase tracking-widest text-neutral-500">Posts</span>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <span className="font-serif text-2xl text-emerald-400">{profile.reputationScore.toFixed(1)}</span>
              <span className="font-sans text-[9px] uppercase tracking-widest text-neutral-500">Reputation</span>
            </div>
          </div>
        </div>
      </div>

      {/* User's Posts */}
      <div>
        <h2 className="font-sans text-xs uppercase tracking-widest text-neutral-400 mb-8 flex items-center gap-2">
          Recent Activity
        </h2>
        
        {profile.Posts.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 font-serif italic border border-white/5 rounded-xl bg-neutral-900/30">
            No posts yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.Posts.map(post => (
              <div key={post.id} className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden flex flex-col relative group">
                <PostActions postId={post.id} authorId={post.authorId} initialContent={post.content} />
                {post.images && post.images.length > 0 && (
                  <div className="relative w-full h-64">
                    <Image
                      src={post.images[0]}
                      alt="Post image"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <span className="block font-serif text-[10px] text-neutral-500 mb-3">
                    {new Date(post.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  <p className="font-serif text-neutral-300 text-sm mb-4">
                    {post.content}
                  </p>
                  
                  <div className="flex items-center gap-4 text-neutral-400 mt-auto pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Heart size={16} strokeWidth={1.5} />
                      <span className="text-xs">{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle size={16} strokeWidth={1.5} />
                      <span className="text-xs">{post.Comments.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProfileVaultClient username={profile.username} />
    </main>
  );
}
