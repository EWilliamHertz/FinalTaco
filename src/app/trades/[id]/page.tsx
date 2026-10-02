import { getCurrentUser } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import LiveTradeRoom from "./LiveTradeRoom";

export default async function TradeRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getCurrentUser();
  if (!user) return notFound();

  const trade = await prisma.trade.findUnique({
    where: { id: resolvedParams.id },
    include: {
      Sender: true,
      Receiver: true,
      OfferedItems: {
        include: {
          Instance: {
            include: { Card: true }
          }
        }
      },
      RequestedItems: {
        include: {
          Instance: {
            include: { Card: true }
          }
        }
      }
    }
  });

  if (!trade) return notFound();

  // Validate the user is part of the trade
  if (trade.senderId !== user.id && trade.receiverId !== user.id) {
    return notFound();
  }

  return <LiveTradeRoom trade={trade} currentUser={user} />;
}
