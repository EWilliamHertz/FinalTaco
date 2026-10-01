"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { writeFile } from "fs/promises";
import path from "path";
import { existsSync, mkdirSync } from "fs";

export async function createPost(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const content = formData.get("content") as string;
  let image = formData.get("image") as string; // existing image URL approach
  const game = formData.get("game") as string;
  
  const imageFile = formData.get("imageFile") as File;
  
  if (imageFile && imageFile.size > 0) {
    try {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Ensure the uploads directory exists
      const uploadDir = path.join(process.cwd(), "public/uploads");
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }
      
      // Create a unique filename
      const ext = imageFile.name.split('.').pop() || 'png';
      const filename = `${crypto.randomUUID()}.${ext}`;
      const filepath = path.join(uploadDir, filename);
      
      // Write the file locally
      await writeFile(filepath, buffer);
      
      // Set the image URL to the public path
      image = `/uploads/${filename}`;
    } catch (e) {
      console.error(e);
      return { success: false, error: "Local image upload failed" };
    }
  }

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

export async function getPosts(skip = 0, take = 12) {
  const user = await getCurrentUser();
  
  try {
    const posts = await prisma.post.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        Author: {
          select: { username: true, avatarUrl: true }
        },
        Comments: {
          include: {
            Author: { select: { username: true, avatarUrl: true } }
          },
          orderBy: { createdAt: "asc" }
        },
        PostLikes: user ? {
          where: { userId: user.id }
        } : undefined
      }
    });
    
    return posts.map(post => ({
      ...post,
      hasLiked: post.PostLikes ? post.PostLikes.length > 0 : false
    }));
  } catch (err: any) {
    console.error("GET POSTS ERROR:", err);
    throw err;
  }
}

export async function toggleLike(postId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id
        }
      }
    });

    if (existingLike) {
      await prisma.postLike.delete({
        where: { id: existingLike.id }
      });
      await prisma.post.update({
        where: { id: postId },
        data: { likes: { decrement: 1 } }
      });
    } else {
      await prisma.postLike.create({
        data: {
          postId,
          userId: user.id
        }
      });
      await prisma.post.update({
        where: { id: postId },
        data: { likes: { increment: 1 } }
      });
    }

    revalidatePath("/feed");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to toggle like" };
  }
}

export async function addComment(postId: string, content: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    await prisma.comment.create({
      data: {
        postId,
        authorId: user.id,
        content
      }
    });
    
    revalidatePath("/feed");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to add comment" };
  }
}

export async function deletePost(postId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return { success: false, error: "Post not found" };

    if (post.authorId !== user.id && user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.post.delete({ where: { id: postId } });
    revalidatePath("/feed");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to delete post" };
  }
}

export async function editPost(postId: string, newContent: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return { success: false, error: "Post not found" };

    if (post.authorId !== user.id && user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.post.update({
      where: { id: postId },
      data: { content: newContent }
    });
    revalidatePath("/feed");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to edit post" };
  }
}
