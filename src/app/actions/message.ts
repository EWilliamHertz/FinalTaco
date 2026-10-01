"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/app/actions/auth";
import { revalidatePath } from "next/cache";

export async function getConversations() {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user.id },
          { receiverId: user.id }
        ]
      },
      include: {
        Sender: { select: { id: true, username: true, avatarUrl: true } },
        Receiver: { select: { id: true, username: true, avatarUrl: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    const conversationsMap = new Map();
    for (const msg of messages) {
      const otherUser = msg.senderId === user.id ? msg.Receiver : msg.Sender;
      if (!conversationsMap.has(otherUser.id)) {
        conversationsMap.set(otherUser.id, {
          otherUser,
          lastMessage: msg,
          unreadCount: msg.receiverId === user.id && !msg.read ? 1 : 0
        });
      } else {
        if (msg.receiverId === user.id && !msg.read) {
          conversationsMap.get(otherUser.id).unreadCount += 1;
        }
      }
    }

    return { success: true, conversations: Array.from(conversationsMap.values()) };
  } catch (error) {
    console.error("Error getting conversations:", error);
    return { success: false, error: "Failed to load conversations" };
  }
}

export async function getMessages(otherUsername: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const otherUser = await prisma.user.findUnique({
      where: { username: otherUsername }
    });

    if (!otherUser) return { success: false, error: "User not found" };

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: otherUser.id },
          { senderId: otherUser.id, receiverId: user.id }
        ]
      },
      orderBy: { createdAt: "asc" }
    });

    const unreadIds = messages
      .filter(m => m.receiverId === user.id && !m.read)
      .map(m => m.id);

    if (unreadIds.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: unreadIds } },
        data: { read: true }
      });
    }

    return { success: true, messages, otherUser };
  } catch (error) {
    console.error("Error getting messages:", error);
    return { success: false, error: "Failed to load messages" };
  }
}

export async function sendMessage(otherUsername: string, content: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  if (!content || !content.trim()) return { success: false, error: "Message cannot be empty" };

  try {
    const otherUser = await prisma.user.findUnique({
      where: { username: otherUsername }
    });

    if (!otherUser) return { success: false, error: "User not found" };

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId: otherUser.id,
        content: content.trim()
      }
    });

    revalidatePath("/messages");
    revalidatePath(`/messages/${otherUsername}`);

    return { success: true, message };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: "Failed to send message" };
  }
}
