import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { stripe, getSubscriptionPeriod } from "@/app/lib/stripe";
import { notifyUser, notifyAdmins } from "@/app/lib/notifications";
import { createCommission } from "@/app/lib/commission";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { sessionId } = await request.json();
    if (!sessionId) return NextResponse.json({ error: "Missing session ID" }, { status: 400 });

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const stripeSubId = checkoutSession.subscription as string;
    if (!stripeSubId) return NextResponse.json({ error: "No subscription" }, { status: 400 });

    // Check if already processed
    const existingSub = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubId },
    });
    if (existingSub) {
      return NextResponse.json({ status: "already_processed", subscription: existingSub });
    }

    const { userId, type } = checkoutSession.metadata || {};
    if (!userId || userId !== session.userId || !type) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    // Get period from Stripe
    const period = await getSubscriptionPeriod(stripeSubId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const subscriptionType = type === "MANAGED" ? "MANAGED" as const : "SIGNALS" as const;
    const planLabel = subscriptionType === "MANAGED" ? "Managed Trading" : "Signals";
    const amount = (checkoutSession.amount_total || 0) / 100;

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        type: subscriptionType,
        status: "ACTIVE",
        stripeSubscriptionId: stripeSubId,
        stripePriceId: checkoutSession.metadata?.planId || null,
        currentPeriodStart: period.start,
        currentPeriodEnd: period.end,
      },
    });

    // Create invoice
    const crypto = require("crypto");
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
      where: { createdAt: { gte: new Date(`${year}-01-01`) } },
    });
    const suffix = crypto.randomBytes(2).toString("hex");
    const invoiceNumber = `KDX-${year}-${String(count + 1).padStart(4, "0")}-${suffix}`;

    // Get receipt URL
    let stripeReceiptUrl: string | null = null;
    if (checkoutSession.payment_intent) {
      try {
        const pi = await stripe.paymentIntents.retrieve(checkoutSession.payment_intent as string);
        if ((pi as any).latest_charge) {
          const charge = await stripe.charges.retrieve((pi as any).latest_charge as string);
          stripeReceiptUrl = (charge as any).receipt_url || null;
        }
      } catch (e) {
        console.error("Failed to get receipt URL:", e);
      }
    }

    await prisma.invoice.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        invoiceNumber,
        amount,
        plan: planLabel,
        status: "paid",
        stripePaymentId: checkoutSession.payment_intent as string || null,
        stripeReceiptUrl,
      },
    });

    // Check if user has telegram connected
    const userTg = await prisma.user.findUnique({ where: { id: userId }, select: { telegramChatId: true } });
    const tgMessage = !userTg?.telegramChatId
      ? " Connect your Telegram in Settings to receive real-time signals!"
      : "";

    // Notifications
    await notifyUser(userId, "Subscription activated",
      `Your ${planLabel} subscription is now active. Next billing: ${period.end.toLocaleDateString("en-US")}.${tgMessage}`,
      "system"
    );
    await notifyAdmins("New subscription",
      `${user.firstName} ${user.lastName} (${user.email}) subscribed to ${planLabel} for ${amount.toFixed(2)}€.`,
      "system"
    );

    // Commission
    try {
      await createCommission({
        subscriptionId: subscription.id,
        grossAmount: amount,
        stripePaymentId: checkoutSession.payment_intent as string || undefined,
        referredUserId: userId,
      });
    } catch (err) {
      console.error("Commission creation error:", err);
    }

    return NextResponse.json({ status: "created", subscription });
  } catch (error) {
    console.error("Verify session error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
