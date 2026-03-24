import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import NotificationDetail from "./NotificationDetail";

export default async function NotificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const notification = await prisma.notification.findUnique({ where: { id } });

  if (!notification || (notification.userId !== null && notification.userId !== session.userId)) {
    redirect("/dashboard/notifications");
  }

  // Mark as read
  if (!notification.read) {
    await prisma.notification.update({ where: { id }, data: { read: true } });
  }

  // Find related content based on type and title
  let relatedCall = null;
  let relatedNews = null;

  if (notification.type === "call") {
    // Extract pair name from title like "New Call: BTC/USDT"
    const pairMatch = notification.title.match(/:\s*(.+)/);
    if (pairMatch) {
      const pairName = pairMatch[1].trim();
      const [base, quote] = pairName.split("/");
      if (base && quote) {
        const pair = await prisma.tradingPair.findUnique({
          where: { base_quote: { base, quote } },
        });
        if (pair) {
          relatedCall = await prisma.call.findFirst({
            where: { tradingPairId: pair.id },
            orderBy: { createdAt: "desc" },
            include: {
              tradingPair: true,
              targets: { orderBy: { rank: "asc" } },
            },
          });
        }
      }
    }
  }

  if (notification.type === "news") {
    // Extract title from notification title like "New Article: Bitcoin..."
    const titleMatch = notification.title.match(/:\s*(.+)/);
    if (titleMatch) {
      const newsTitle = titleMatch[1].trim();
      relatedNews = await prisma.news.findFirst({
        where: { title: { contains: newsTitle } },
        orderBy: { createdAt: "desc" },
      });
    }
  }

  return (
    <NotificationDetail
      notification={{
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt.toISOString(),
      }}
      relatedCall={relatedCall ? {
        pair: `${relatedCall.tradingPair.base}/${relatedCall.tradingPair.quote}`,
        entryMin: relatedCall.entryMin,
        entryMax: relatedCall.entryMax,
        stopLoss: relatedCall.stopLoss,
        active: relatedCall.active,
        targets: relatedCall.targets.map((t) => ({ rank: t.rank, price: t.price, reached: t.reached })),
        createdAt: relatedCall.createdAt.toISOString(),
      } : null}
      relatedNews={relatedNews ? {
        title: relatedNews.title,
        description: relatedNews.description,
        imageUrl: relatedNews.imageUrl || "",
        createdAt: relatedNews.createdAt.toISOString(),
      } : null}
    />
  );
}
