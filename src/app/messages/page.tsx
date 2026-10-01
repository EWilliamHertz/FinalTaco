import { getConversations } from "@/app/actions/message";
import { getCurrentUser } from "@/app/actions/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NewMessageClient } from "./NewMessageClient";

export default async function MessagesDashboard() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { success, conversations, error } = await getConversations();

  if (!success) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-[calc(100vh-64px)]">
      <div className="flex justify-between items-end mb-8"><h1 className="font-serif text-4xl text-white font-light uppercase tracking-widest">Messages</h1><NewMessageClient /></div>
      
      {(!conversations || conversations.length === 0) ? (
        <div className="py-20 text-center opacity-50"><p className="font-serif text-2xl text-neutral-400 mb-2">No Conversations</p><p className="font-sans text-xs uppercase tracking-widest text-neutral-500 mb-6">Start chatting with other collectors.</p><NewMessageClient /></div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conv) => (
            <Link 
              key={conv.otherUser.id} 
              href={`/messages/${conv.otherUser.username}`}
              className="block bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                    {conv.otherUser.avatarUrl ? (
                      <img src={conv.otherUser.avatarUrl} alt={conv.otherUser.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-gray-500">{conv.otherUser.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-white">{conv.otherUser.username}</h2>
                    <p className="text-gray-400 text-sm truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                      {conv.lastMessage.senderId === user.id ? "You: " : ""}{conv.lastMessage.content}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2 shrink-0 ml-4">
                  <span className="text-xs text-gray-500">
                    {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {conv.unreadCount} new
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
