import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import SubscriptionContent from "./SubscriptionContent";

export default async function SubscriptionPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      trialEndsAt: true,
      stripeCustomerId: true,
      telegramChatId: true,
      subscriptions: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          cancelledAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) redirect("/login");

  const activeSub = user.subscriptions.find((s) => s.status === "ACTIVE");

  return (
    <SubscriptionContent
      activeSub={activeSub ? {
        ...activeSub,
        currentPeriodStart: activeSub.currentPeriodStart.toISOString(),
        currentPeriodEnd: activeSub.currentPeriodEnd.toISOString(),
        createdAt: activeSub.createdAt.toISOString(),
      } : null}
      hasStripeCustomer={!!user.stripeCustomerId}
      hasTelegram={!!user.telegramChatId}
      trialEndsAt={user.trialEndsAt?.toISOString() || null}
      history={user.subscriptions.map((s) => ({
        ...s,
        currentPeriodStart: s.currentPeriodStart.toISOString(),
        currentPeriodEnd: s.currentPeriodEnd.toISOString(),
        cancelledAt: s.cancelledAt?.toISOString() || null,
        createdAt: s.createdAt.toISOString(),
      }))}
    />
  );
}
