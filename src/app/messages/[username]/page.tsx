import { getMessages } from "@/app/actions/message";
import { getCurrentUser } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ChatInterface from "./ChatInterface";

export default async function ChatPage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const { username } = resolvedParams;

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.username === username) {
    return <div className="p-8 text-white max-w-4xl mx-auto">You cannot message yourself.</div>;
  }

  const { success, messages, otherUser, error } = await getMessages(username);

  if (!success || !otherUser) {
    return <div className="p-8 text-red-500 max-w-4xl mx-auto">Error: {error || "Failed to load chat"}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-64px)] flex flex-col pt-6 px-4 pb-0">
      <div className="flex items-center space-x-4 pb-4 border-b border-neutral-800 shrink-0">
        <Link href="/messages" className="text-gray-400 hover:text-white transition">
          &larr; Back
        </Link>
        <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center overflow-hidden shrink-0">
          {otherUser.avatarUrl ? (
            <img src={otherUser.avatarUrl} alt={otherUser.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-gray-500">{otherUser.username.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <h1 className="text-xl font-bold text-white truncate">{otherUser.username}</h1>
      </div>

      <ChatInterface 
        initialMessages={messages || []} 
        currentUserId={user.id} 
        otherUsername={otherUser.username} 
      />
    </div>
  );
}
