import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe, getSubscriptionPeriod } from "@/app/lib/stripe";
import { prisma } from "@/app/lib/prisma";
import type Stripe from "stripe";
import { notifyUser, notifyAdmins } from "@/app/lib/notifications";
import { createCommission, cancelCommissions } from "@/app/lib/commission";

async function generateInvoiceNumber(): Promise<string> {
  const crypto = require("crypto");
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { createdAt: { gte: new Date(`${year}-01-01`) } },
  });
  const suffix = crypto.randomBytes(2).toString("hex");
  return `KDX-${year}-${String(count + 1).padStart(4, "0")}-${suffix}`;
}

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ─── CHECKOUT COMPLETED (subscription created) ────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode !== "subscription") break;

        const { userId, planId, type } = session.metadata || {};
        if (!userId || !type) break;

        const stripeSubId = session.subscription as string;
        if (!stripeSubId) break;

        // Idempotency check
        const existingSub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSubId },
        });
        if (existingSub) {
          console.log(`Subscription already exists for ${stripeSubId}, skipping`);
          break;
        }

        // Get subscription details from Stripe
        const stripePeriod = await getSubscriptionPeriod(stripeSubId);
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, firstName: true, lastName: true, email: true, trialEndsAt: true },
        });

        if (!user) break;

        const subscriptionType = type === "MANAGED" ? "MANAGED" as const : "SIGNALS" as const;
        const periodStart = stripePeriod.start;
        const periodEnd = stripePeriod.end;
        const amount = (session.amount_total || 0) / 100;
        const planLabel = subscriptionType === "MANAGED" ? "Managed Trading" : "Signals";

        // Create subscription in DB
        const subscription = await prisma.subscription.create({
          data: {
            userId,
            type: subscriptionType,
            status: "ACTIVE",
            stripeSubscriptionId: stripeSubId,
            stripePriceId: planId || null,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
        });

        // Get receipt URL
        let stripeReceiptUrl: string | null = null;
        if (session.payment_intent) {
          try {
            const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string);
            if (pi.latest_charge) {
              const charge = await stripe.charges.retrieve(pi.latest_charge as string);
              stripeReceiptUrl = charge.receipt_url || null;
            }
          } catch (e) {
            console.error("Failed to get receipt URL:", e);
          }
        }

        // Create invoice
        const invoiceNumber = await generateInvoiceNumber();
        await prisma.invoice.create({
          data: {
            userId,
            subscriptionId: subscription.id,
            invoiceNumber,
            amount,
            plan: planLabel,
            status: "paid",
            stripePaymentId: session.payment_intent as string || null,
            stripeReceiptUrl,
          },
        });

        // Check telegram
        const userTg = await prisma.user.findUnique({ where: { id: userId }, select: { telegramChatId: true } });
        const tgMsg = !userTg?.telegramChatId ? " Connect your Telegram in Settings to receive real-time signals!" : "";

        // Notifications
        await notifyUser(userId, "Subscription activated",
          `Your ${planLabel} subscription is now active. Next billing: ${periodEnd.toLocaleDateString("en-US")}.${tgMsg}`,
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
            stripePaymentId: session.payment_intent as string || undefined,
            referredUserId: userId,
          });
        } catch (err) {
          console.error("Commission creation error:", err);
        }

        console.log(`Subscription created: ${user.email} → ${planLabel} (${invoiceNumber})`);
        break;
      }

      // ─── INVOICE PAID (recurring payment success) ─────
      case "invoice.paid": {
        const invoice = event.data.object as any;

        // Skip first invoice (handled by checkout.session.completed)
        if (invoice.billing_reason === "subscription_create") break;

        const stripeSubId = typeof invoice.subscription === "string"
          ? invoice.subscription
          : (invoice.subscription as { id?: string })?.id;

        if (!stripeSubId) break;

        const sub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSubId },
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        });

        if (!sub) break;

        // Update subscription period
        const stripePeriod = await getSubscriptionPeriod(stripeSubId);
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: "ACTIVE",
            currentPeriodStart: stripePeriod.start,
            currentPeriodEnd: stripePeriod.end,
          },
        });

        // Create invoice record
        const amount = ((invoice.amount_paid as number) || 0) / 100;
        const invoiceNumber = await generateInvoiceNumber();

        let stripeReceiptUrl: string | null = null;
        if (invoice.charge) {
          try {
            const chargeId = typeof invoice.charge === "string" ? invoice.charge : (invoice.charge as { id: string }).id;
            const charge = await stripe.charges.retrieve(chargeId);
            stripeReceiptUrl = (charge as unknown as { receipt_url?: string }).receipt_url || null;
          } catch (e) {
            console.error("Failed to get receipt URL:", e);
          }
        }

        await prisma.invoice.create({
          data: {
            userId: sub.userId,
            subscriptionId: sub.id,
            invoiceNumber,
            amount,
            plan: sub.type === "MANAGED" ? "Managed Trading" : "Signals",
            status: "paid",
            stripePaymentId: typeof invoice.payment_intent === "string" ? invoice.payment_intent : null,
            stripeReceiptUrl,
          },
        });

        // Notify
        await notifyUser(sub.userId, "Payment successful",
          `Your subscription has been renewed. Next billing: ${stripePeriod.end.toLocaleDateString("en-US")}.`,
          "system"
        );

        // Commission for renewal
        try {
          await createCommission({
            subscriptionId: sub.id,
            grossAmount: amount,
            stripePaymentId: typeof invoice.payment_intent === "string" ? invoice.payment_intent : undefined,
            referredUserId: sub.userId,
          });
        } catch (err) {
          console.error("Commission creation error:", err);
        }

        console.log(`Renewal: ${sub.user.email} — ${invoiceNumber} (${amount}€)`);
        break;
      }

      // ─── INVOICE PAYMENT FAILED ───────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const stripeSubId = typeof invoice.subscription === "string"
          ? invoice.subscription
          : (invoice.subscription as { id?: string })?.id;

        if (!stripeSubId) break;

        const sub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSubId },
        });

        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "PAST_DUE" },
          });

          await notifyUser(sub.userId, "Payment failed",
            "Your subscription payment failed. Please update your payment method to avoid losing access.",
            "system"
          );
        }

        console.log(`Payment failed for subscription ${stripeSubId}`);
        break;
      }

      // ─── SUBSCRIPTION UPDATED ─────────────────────────
      case "customer.subscription.updated": {
        const stripeSub = event.data.object as any;

        const sub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSub.id },
        });

        if (sub) {
          const newStatus = stripeSub.status === "active" ? "ACTIVE" as const
            : stripeSub.status === "past_due" ? "PAST_DUE" as const
            : stripeSub.status === "canceled" ? "CANCELLED" as const
            : "EXPIRED" as const;

          const period = await getSubscriptionPeriod(stripeSub.id);

          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: newStatus,
              currentPeriodStart: period.start,
              currentPeriodEnd: period.end,
              ...(newStatus === "CANCELLED" ? { cancelledAt: new Date() } : {}),
            },
          });
        }
        break;
      }

      // ─── SUBSCRIPTION DELETED ─────────────────────────
      case "customer.subscription.deleted": {
        const stripeSub = event.data.object as any;

        const sub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSub.id },
        });

        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "CANCELLED", cancelledAt: new Date() },
          });

          await cancelCommissions({ subscriptionId: sub.id, reason: "subscription_cancelled" });

          await notifyUser(sub.userId, "Subscription cancelled",
            "Your subscription has been cancelled. You can resubscribe anytime.",
            "system"
          );

          console.log(`Subscription deleted: ${stripeSub.id}`);
        }
        break;
      }

      // ─── CHARGE REFUNDED ──────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;

        if (paymentIntentId) {
          const inv = await prisma.invoice.findFirst({
            where: { stripePaymentId: paymentIntentId },
          });

          if (inv) {
            await prisma.invoice.update({ where: { id: inv.id }, data: { status: "refunded" } });
            await prisma.subscription.update({
              where: { id: inv.subscriptionId },
              data: { status: "EXPIRED", cancelledAt: new Date() },
            });
            await cancelCommissions({ subscriptionId: inv.subscriptionId, reason: "refund" });
            await notifyUser(inv.userId, "Refund processed", "Your payment has been refunded and subscription cancelled.");
          }
        }
        break;
      }

      // ─── CHARGE DISPUTED ──────────────────────────────
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;

        if (chargeId) {
          const charge = await stripe.charges.retrieve(chargeId);
          const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;

          if (paymentIntentId) {
            const inv = await prisma.invoice.findFirst({
              where: { stripePaymentId: paymentIntentId },
              include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
            });

            if (inv) {
              await prisma.invoice.update({ where: { id: inv.id }, data: { status: "disputed" } });
              await prisma.subscription.update({
                where: { id: inv.subscriptionId },
                data: { status: "EXPIRED", cancelledAt: new Date() },
              });
              await cancelCommissions({ subscriptionId: inv.subscriptionId, reason: "dispute" });
              await notifyUser(inv.userId, "Account suspended", "Your account has been suspended due to a payment dispute.");
              await notifyAdmins("DISPUTE ALERT",
                `Dispute from ${inv.user.firstName} ${inv.user.lastName} (${inv.user.email}) — ${inv.amount.toFixed(2)}€.`,
                "system"
              );
            }
          }
        }
        break;
      }
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
