import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

// Map plan IDs to Stripe Price IDs (recurring)
export const PLAN_CONFIG: Record<string, { priceId: string; type: "SIGNALS" | "MANAGED"; name: string }> = {
  signals_monthly: {
    priceId: process.env.STRIPE_PRICE_SIGNALS_MONTHLY || "",
    type: "SIGNALS",
    name: "Kodex Signals — Monthly",
  },
  signals_quarterly: {
    priceId: process.env.STRIPE_PRICE_SIGNALS_QUARTERLY || "",
    type: "SIGNALS",
    name: "Kodex Signals — Quarterly",
  },
  managed_monthly: {
    priceId: process.env.STRIPE_PRICE_MANAGED_MONTHLY || "",
    type: "MANAGED",
    name: "Kodex Managed Trading — Monthly",
  },
};

// Helper to get subscription period dates from Stripe subscription
// In Stripe API 2026+, current_period is on items, not on subscription root
export async function getSubscriptionPeriod(stripeSubId: string): Promise<{ start: Date; end: Date }> {
  const sub = await stripe.subscriptions.retrieve(stripeSubId) as any;

  // Try items first (new API)
  const item = sub.items?.data?.[0];
  if (item?.current_period_start && item?.current_period_end) {
    return {
      start: new Date(item.current_period_start * 1000),
      end: new Date(item.current_period_end * 1000),
    };
  }

  // Fallback: root level (old API)
  if (sub.current_period_start && sub.current_period_end) {
    return {
      start: new Date(sub.current_period_start * 1000),
      end: new Date(sub.current_period_end * 1000),
    };
  }

  // Last fallback: calculate from plan interval
  const start = new Date((sub.start_date || sub.created) * 1000);
  const end = new Date(start);
  const interval = sub.plan?.interval || "month";
  const intervalCount = sub.plan?.interval_count || 1;
  if (interval === "month") end.setMonth(end.getMonth() + intervalCount);
  else if (interval === "year") end.setFullYear(end.getFullYear() + intervalCount);
  else if (interval === "week") end.setDate(end.getDate() + 7 * intervalCount);
  else end.setDate(end.getDate() + intervalCount);

  return { start, end };
}
