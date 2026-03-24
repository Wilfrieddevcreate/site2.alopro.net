import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import Sidebar from "./components/Sidebar";
import DashboardHeader from "./components/DashboardHeader";
import AccessBanner from "./components/AccessBanner";
import PwaInstallPrompt from "./components/PwaInstallPrompt";

function daysBetween(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / 86400000);
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      firstName: true,
      lastName: true,
      emailVerified: true,
      trialEndsAt: true,
      subscriptions: {
        where: { status: "ACTIVE" },
        orderBy: { currentPeriodEnd: "desc" },
        select: { type: true, currentPeriodEnd: true },
        take: 1,
      },
    },
  });

  if (!user || !user.emailVerified) {
    redirect("/login");
  }

  // Compute access status
  const now = new Date();
  const activeSub = user.subscriptions[0] || null;
  const trialActive = user.trialEndsAt ? user.trialEndsAt > now : false;

  let accessStatus: "trial" | "subscribed" | "expiring" | "expired" | "none";
  let daysLeft = 0;

  if (activeSub) {
    daysLeft = daysBetween(now, activeSub.currentPeriodEnd);
    if (daysLeft <= 7 && daysLeft > 0) {
      accessStatus = "expiring";
    } else if (daysLeft <= 0) {
      accessStatus = "expired";
    } else {
      accessStatus = "subscribed";
    }
  } else if (trialActive && user.trialEndsAt) {
    daysLeft = daysBetween(now, user.trialEndsAt);
    accessStatus = "trial";
  } else {
    accessStatus = "none";
  }

  return (
    <div className="flex h-full bg-black">
      <Sidebar subscriptionType={activeSub?.type || null} />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Background image on main content */}
        <div className="absolute inset-0 z-0">
          <img src="/assets/images/auth-bg.jpg.jpeg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/75" />
        </div>
        <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
          <DashboardHeader userName={`${user.firstName} ${user.lastName}`} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <AccessBanner
              status={accessStatus}
              trialEndsAt={user.trialEndsAt?.toISOString() || null}
              subscriptionEndsAt={activeSub?.currentPeriodEnd.toISOString() || null}
              subscriptionType={activeSub?.type || null}
              daysLeft={daysLeft}
            />
            {children}
          </main>
        </div>
      </div>
      <PwaInstallPrompt />
    </div>
  );
}
