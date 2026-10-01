"use client";

import { useState, useRef, useEffect } from "react";
import { sendMessage } from "@/app/actions/message";
import { useRouter } from "next/navigation";

export default function ChatInterface({ 
  initialMessages, 
  currentUserId, 
  otherUsername 
}: { 
  initialMessages: any[]; 
  currentUserId: string; 
  otherUsername: string; 
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Optional simple polling to catch new messages
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000); // refresh every 5 seconds
    return () => clearInterval(interval);
  }, [router]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    setIsSending(true);
    
    const tempId = `temp-${Date.now()}`;
    const newMsg = {
      id: tempId,
      senderId: currentUserId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      read: false
    };
    
    setMessages(prev => [...prev, newMsg]);
    setContent("");

    const res = await sendMessage(otherUsername, newMsg.content);
    if (!res.success) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert("Failed to send message: " + res.error);
    } else {
      router.refresh();
    }
    
    setIsSending(false);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2 min-h-0" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">No messages yet. Say hi!</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div 
                  className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-2 break-words ${
                    isMe 
                      ? "bg-blue-600 text-white rounded-tr-sm" 
                      : "bg-neutral-800 text-gray-100 rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-500 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="py-4 border-t border-neutral-800 shrink-0 mb-4">
        <form onSubmit={handleSend} className="flex space-x-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-neutral-900 border border-neutral-800 text-white rounded-full px-4 py-2 focus:outline-none focus:border-neutral-600"
            disabled={isSending}
            autoComplete="off"
          />
          <button 
            type="submit" 
            disabled={!content.trim() || isSending}
            className="bg-white text-black px-6 py-2 rounded-full font-semibold hover:bg-gray-200 disabled:opacity-50 transition"
          >
            Send
          </button>
        </form>
      </div>
    </>
  );
}
