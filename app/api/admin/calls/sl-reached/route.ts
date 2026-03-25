import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import { prisma } from "@/app/lib/prisma";
import { notifyBroadcast } from "@/app/lib/notifications";
import { sendPushToAll } from "@/app/lib/push";
import { sendStopLossReachedToTelegram } from "@/app/lib/telegram";

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { callId } = await request.json();
    if (!callId) {
      return NextResponse.json({ error: "Call ID is required" }, { status: 400 });
    }

    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: { tradingPair: true },
    });

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    if (call.stopLossReached) {
      return NextResponse.json({ error: "Stop loss already marked as reached" }, { status: 400 });
    }

    await prisma.call.update({
      where: { id: callId },
      data: { stopLossReached: true, active: false },
    });

    const pair = `${call.tradingPair.base}/${call.tradingPair.quote}`;
    const slPct = (((call.stopLoss - (call.entryMin + call.entryMax) / 2) / ((call.entryMin + call.entryMax) / 2)) * 100).toFixed(1);
    const notifTitle = `Stop Loss Hit: ${pair}`;
    const notifMsg = `Stop Loss at ${call.stopLoss} (${slPct}%) has been hit for ${pair}. Position closed.`;
    const callLink = `/dashboard?tab=calls&callId=${call.id}`;

    // Notifications
    notifyBroadcast(notifTitle, notifMsg, "call", callLink).catch(console.error);
    sendPushToAll({ title: `🛑 ${notifTitle}`, message: notifMsg, url: callLink }).catch(console.error);
    sendStopLossReachedToTelegram({
      pair,
      stopLoss: call.stopLoss,
      entryMin: call.entryMin,
      entryMax: call.entryMax,
    }).catch(console.error);

    return NextResponse.json({ message: "Stop loss marked as reached", pair });
  } catch (err) {
    console.error("SL reached error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
