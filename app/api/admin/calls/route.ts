import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import { prisma } from "@/app/lib/prisma";
import { sendPushToAll } from "@/app/lib/push";
import { sendCallToTelegram } from "@/app/lib/telegram";
import { notifyBroadcast } from "@/app/lib/notifications";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(request.url);
  const skip = parseInt(url.searchParams.get("skip") || "0");
  const take = parseInt(url.searchParams.get("take") || "10");

  const [items, total] = await Promise.all([
    prisma.call.findMany({
      skip, take, orderBy: { createdAt: "desc" },
      include: { tradingPair: true, targets: { orderBy: { rank: "asc" } } },
    }),
    prisma.call.count(),
  ]);

  return NextResponse.json({ items, total });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { tradingPairId, entryMin, entryMax, stopLoss, targets, active } = await request.json();

    if (!tradingPairId || entryMin == null || entryMax == null || stopLoss == null || !targets?.length) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const call = await prisma.call.create({
      data: {
        tradingPairId,
        entryMin: parseFloat(entryMin),
        entryMax: parseFloat(entryMax),
        stopLoss: parseFloat(stopLoss),
        active: active ?? true,
      },
    });

    for (const t of targets) {
      await prisma.callTarget.create({
        data: { callId: call.id, rank: t.rank, price: parseFloat(t.price) },
      });
    }

    // Notifications: push + telegram
    const pair = await prisma.tradingPair.findUnique({ where: { id: tradingPairId } });
    if (pair && (active ?? true)) {
      const callInfo = {
        pair: `${pair.base}/${pair.quote}`,
        entryMin: parseFloat(entryMin),
        entryMax: parseFloat(entryMax),
        stopLoss: parseFloat(stopLoss),
        targets: targets.map((t: { rank: number; price: string }) => ({ rank: t.rank, price: parseFloat(t.price) })),
      };

      const notifTitle = `New Call: ${callInfo.pair}`;
      const notifMsg = `Entry: ${callInfo.entryMin} — ${callInfo.entryMax} | SL: ${callInfo.stopLoss}`;
      const callLink = `/dashboard?tab=calls&callId=${call.id}`;

      // DB notification (visible in bell)
      notifyBroadcast(notifTitle, notifMsg, "call", callLink).catch(console.error);

      // Push notification (browser)
      sendPushToAll({ title: notifTitle, message: notifMsg, url: callLink }).catch(console.error);

      // Telegram
      sendCallToTelegram(callInfo).catch(console.error);
    }

    return NextResponse.json({ call });
  } catch (err) {
    console.error("Create call error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await request.json();
    await prisma.callTarget.deleteMany({ where: { callId: id } });
    await prisma.call.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete call error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id, active } = await request.json();
    await prisma.call.update({ where: { id }, data: { active } });
    return NextResponse.json({ message: "Updated" });
  } catch (err) {
    console.error("Update call error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
