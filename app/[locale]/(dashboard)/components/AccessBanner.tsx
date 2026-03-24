"use client";

import { Link } from "@/app/i18n/navigation";

interface Props {
  status: "trial" | "subscribed" | "expiring" | "expired" | "none";
  trialEndsAt?: string | null;
  subscriptionEndsAt?: string | null;
  subscriptionType?: string | null;
  daysLeft?: number;
}

export default function AccessBanner({ status, trialEndsAt, subscriptionEndsAt, subscriptionType, daysLeft }: Props) {
  if (status === "trial" && trialEndsAt) {
    const endDate = new Date(trialEndsAt).toLocaleDateString("en-GB");
    return (
      <div className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-sm text-amber-400 font-medium">
            Free trial — expires {endDate} ({daysLeft} day{daysLeft !== 1 ? "s" : ""} left)
          </span>
        </div>
        <Link href="/subscribe" className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover transition-colors">
          Subscribe now
        </Link>
      </div>
    );
  }

  if (status === "expiring" && subscriptionEndsAt) {
    const endDate = new Date(subscriptionEndsAt).toLocaleDateString("en-GB");
    return (
      <div className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-sm text-amber-400 font-medium">
            Your {subscriptionType === "MANAGED" ? "Managed Trading" : "Signals"} subscription expires on {endDate} ({daysLeft} day{daysLeft !== 1 ? "s" : ""} left)
          </span>
        </div>
        <Link href="/subscribe" className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover transition-colors">
          Renew
        </Link>
      </div>
    );
  }

  if (status === "subscribed") {
    return null; // No banner needed when subscription is active and not expiring
  }

  if (status === "expired" || status === "none") {
    return (
      <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 rounded-full bg-red-400" />
          <span className="text-sm text-red-400 font-medium">
            Your access has expired. Subscribe to continue using Kodex.
          </span>
        </div>
        <Link href="/subscribe" className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover transition-colors">
          Subscribe
        </Link>
      </div>
    );
  }

  return null;
}
