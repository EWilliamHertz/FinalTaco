import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  // Normally we would verify a cron secret here
  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    
    for (const user of users) {
      const instances = await prisma.cardInstance.findMany({
        where: { ownerId: user.id },
        include: { Card: { select: { marketPrice: true, foilPrice: true } } }
      });
      
      let totalValue = 0;
      for (const instance of instances) {
        totalValue += instance.customPrice || instance.Card.marketPrice || 0;
      }
      
      await prisma.portfolioSnapshot.create({
        data: {
          userId: user.id,
          totalValue,
          cardCount: instances.length
        }
      });
    }

    return NextResponse.json({ success: true, snapshotsCreated: users.length });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
