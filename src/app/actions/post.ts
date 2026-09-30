"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const content = formData.get("content") as string;
  const image = formData.get("image") as string; // Optional image URL
  const game = formData.get("game") as string;

  if (!content && !image) return { success: false, error: "Post cannot be empty" };

  try {
    await prisma.post.create({
      data: {
        authorId: user.id,
        content: content || "",
        images: image ? [image] : [],
      }
    });

    revalidatePath("/feed");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to create post" };
  }
}

export async function getPosts() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        Author: {
          select: { username: true, avatarUrl: true }
        }
      }
    });
    
    return posts;
  } catch (err) {
    console.error(err);
    return [];
  }
}
