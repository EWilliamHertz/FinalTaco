"use server"

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/app/actions/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createGroup(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name) throw new Error("Name is required");

  const group = await prisma.communityGroup.create({
    data: {
      name,
      description,
      creatorId: user.id,
      Members: {
        create: {
          userId: user.id,
          role: "ADMIN"
        }
      }
    }
  });

  revalidatePath("/groups");
  redirect(`/groups/${group.id}`);
}

export async function getGroups() {
  return prisma.communityGroup.findMany({
    include: {
      _count: {
        select: { Members: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getGroup(id: string) {
  return prisma.communityGroup.findUnique({
    where: { id },
    include: {
      Creator: {
        select: { id: true, username: true, avatarUrl: true }
      },
      Members: {
        include: {
          User: {
            select: { id: true, username: true, avatarUrl: true }
          }
        }
      }
    }
  });
}

export async function joinGroup(groupId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.groupMember.create({
    data: {
      groupId,
      userId: user.id,
      role: "MEMBER"
    }
  });

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
}

export async function leaveGroup(groupId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.groupMember.delete({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id
      }
    }
  });

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
}
