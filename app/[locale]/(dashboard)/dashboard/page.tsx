import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import DashboardContent from "./DashboardContent";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      firstName: true,
      trialEndsAt: true,
      subscriptions: {
        where: { status: "ACTIVE" },
        select: { type: true, currentPeriodEnd: true },
      },
    },
  });

  if (!user) redirect("/login");

  const now = new Date();
  const hasActiveSubscription = user.subscriptions.length > 0;
  const isTrialActive = user.trialEndsAt ? user.trialEndsAt > now : false;
  const hasAccess = hasActiveSubscription || isTrialActive;

  if (!hasAccess) {
    redirect("/subscribe");
  }

  const subscriptionType = user.subscriptions[0]?.type || null;

  // Only fetch calls/news if user is on trial or has SIGNALS subscription
  // MANAGED users don't need to see calls/news (trading is done for them)
  const showSignalsContent = !subscriptionType || subscriptionType === "SIGNALS"; // trial or signals

  const [activeCalls, latestNews] = await Promise.all([
    showSignalsContent ? prisma.call.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      include: {
        tradingPair: true,
        targets: { orderBy: { rank: "asc" } },
      },
    }) : Promise.resolve([]),
    showSignalsContent ? prisma.news.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, description: true, titleFr: true, descriptionFr: true, titleEs: true, descriptionEs: true, titleTr: true, descriptionTr: true, imageUrl: true, createdAt: true },
    }) : Promise.resolve([]),
  ]);

  return (
    <DashboardContent
      firstName={user.firstName}
      isTrialActive={isTrialActive}
      hasActiveSubscription={hasActiveSubscription}
      trialEndsAt={user.trialEndsAt?.toISOString() || null}
      subscriptionType={user.subscriptions[0]?.type || null}
      activeCalls={activeCalls.map((c) => ({
        id: c.id,
        pair: `${c.tradingPair.base}/${c.tradingPair.quote}`,
        entryMin: c.entryMin,
        entryMax: c.entryMax,
        stopLoss: c.stopLoss,
        targets: c.targets.map((t) => ({ rank: t.rank, price: t.price, reached: t.reached })),
        createdAt: c.createdAt.toISOString(),
      }))}
      latestNews={latestNews.map((n) => {
        let title = n.title;
        let description = n.description;
        if (locale === "fr" && n.titleFr) { title = n.titleFr; description = n.descriptionFr || n.description; }
        else if (locale === "es" && n.titleEs) { title = n.titleEs; description = n.descriptionEs || n.description; }
        else if (locale === "tr" && n.titleTr) { title = n.titleTr; description = n.descriptionTr || n.description; }
        return { id: n.id, title, description, imageUrl: n.imageUrl || "", createdAt: n.createdAt.toISOString() };
      })}
    />
  );
}
