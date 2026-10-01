"use server";

import { prisma } from "@/lib/db";

export async function searchUsers(query: string) {
  if (!query) return [];
  try {
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: "insensitive"
        }
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        reputationScore: true,
        createdAt: true,
        _count: {
          select: { Posts: true, CardInstances: true }
        }
      },
      take: 20
    });
    return users;
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
}

export async function getUserProfile(username: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        reputationScore: true,
        createdAt: true,
        Posts: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            Author: { select: { username: true, avatarUrl: true } },
            Comments: {
              include: { Author: { select: { username: true, avatarUrl: true } } },
              orderBy: { createdAt: "asc" }
            },
            PostLikes: true
          }
        },
        _count: {
          select: { CardInstances: true, Posts: true }
        }
      }
    });
    return user;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function getUserVault(username: string, game?: "POKEMON" | "MTG") {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });
    if (!user) return [];

    const instances = await prisma.cardInstance.findMany({
      where: {
        ownerId: user.id,
        ...(game ? { Card: { game } } : {})
      },
      include: {
        Card: true
      },
      orderBy: { acquiredAt: "desc" },
      take: 100 // limit for now
    });
    return instances;
  } catch (error) {
    console.error("Error fetching user vault:", error);
    return [];
  }
}

export async function toggleFollow(followingId: string) {
  const cookieStore = require('next/headers').cookies;
  const jwt = require('jsonwebtoken');
  const token = (await cookieStore()).get('auth_token')?.value;
  if (!token) return { success: false, error: "Not logged in" };
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "hatakesecret") as { userId: string };
    const followerId = decoded.userId;
    
    const existing = await prisma.follows.findUnique({
      where: { followerId_followingId: { followerId, followingId } }
    });
    
    if (existing) {
      await prisma.follows.delete({ where: { followerId_followingId: { followerId, followingId } } });
      return { success: true, followed: false };
    } else {
      await prisma.follows.create({ data: { followerId, followingId } });
      return { success: true, followed: true };
    }
  } catch (err) {
    return { success: false, error: "Failed to toggle follow" };
  }
}

export async function getUnreadNotifications() {
  const cookieStore = require('next/headers').cookies;
  const jwt = require('jsonwebtoken');
  const token = (await cookieStore()).get('auth_token')?.value;
  if (!token) return { count: 0 };
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "hatakesecret") as { userId: string };
    const count = await prisma.notification.count({
      where: { userId: decoded.userId, read: false }
    });
    return { count };
  } catch (err) {
    return { count: 0 };
  }
}
