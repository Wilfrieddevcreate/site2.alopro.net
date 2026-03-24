import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// This endpoint receives updates from the Telegram Bot API
// The bot must be configured to send updates here via setWebhook
export async function POST(request: Request) {
  try {
    const update = await request.json();

    // Only handle messages with /start command
    if (!update.message?.text) {
      return NextResponse.json({ ok: true });
    }

    const text = update.message.text;
    const chatId = String(update.message.chat.id);
    const telegramUsername = update.message.from?.username || null;

    // /start USER_ID — link telegram to user account
    if (text.startsWith("/start ")) {
      const userId = text.replace("/start ", "").trim();

      if (!userId) {
        await sendBotMessage(chatId, "❌ Invalid link. Please use the link from your Kodex dashboard.");
        return NextResponse.json({ ok: true });
      }

      // Find the user
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        await sendBotMessage(chatId, "❌ User not found. Please make sure you used the correct link from your Kodex dashboard.");
        return NextResponse.json({ ok: true });
      }

      // Check if this chatId is already linked to another user
      const existingLink = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
      if (existingLink && existingLink.id !== userId) {
        await sendBotMessage(chatId, "⚠️ This Telegram account is already linked to another Kodex account.");
        return NextResponse.json({ ok: true });
      }

      // Link the telegram chatId to the user
      await prisma.user.update({
        where: { id: userId },
        data: { telegramChatId: chatId },
      });

      await sendBotMessage(chatId, `✅ Your Telegram is now connected to Kodex!\n\n👤 ${user.firstName} ${user.lastName}\n📧 ${user.email}\n\nYou will receive trading signals and news here when your subscription is active.`);

      return NextResponse.json({ ok: true });
    }

    // /start without params
    if (text === "/start") {
      await sendBotMessage(chatId, "👋 Welcome to Kodex Bot!\n\nTo connect your account, use the link from your Kodex dashboard:\n\n📱 Go to Settings → Connect Telegram\n\nThis will link your Telegram to your Kodex account so you can receive trading signals and news.");
      return NextResponse.json({ ok: true });
    }

    // /status — check connection
    if (text === "/status") {
      const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
      if (!user) {
        await sendBotMessage(chatId, "❌ Your Telegram is not connected to any Kodex account.\n\nUse the link from your dashboard to connect.");
        return NextResponse.json({ ok: true });
      }

      const activeSub = await prisma.subscription.findFirst({
        where: { userId: user.id, status: "ACTIVE" },
      });

      const trialActive = user.trialEndsAt && new Date(user.trialEndsAt) > new Date();

      let statusMsg = `✅ Connected to: ${user.firstName} ${user.lastName}\n📧 ${user.email}\n\n`;
      if (activeSub) {
        statusMsg += `📊 Subscription: ${activeSub.type} (Active)\n`;
        statusMsg += `📅 Expires: ${activeSub.currentPeriodEnd.toLocaleDateString("en-GB")}\n`;
        statusMsg += `\n✅ You will receive signals and news.`;
      } else if (trialActive) {
        statusMsg += `⏳ Free trial until: ${user.trialEndsAt!.toLocaleDateString("en-GB")}\n`;
        statusMsg += `\n✅ You will receive signals and news during your trial.`;
      } else {
        statusMsg += `❌ No active subscription.\n`;
        statusMsg += `\nSubscribe on Kodex to receive signals and news.`;
      }

      await sendBotMessage(chatId, statusMsg);
      return NextResponse.json({ ok: true });
    }

    // /disconnect — unlink account
    if (text === "/disconnect") {
      const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { telegramChatId: null } });
        await sendBotMessage(chatId, "✅ Your Telegram has been disconnected from Kodex. You will no longer receive notifications.");
      } else {
        await sendBotMessage(chatId, "❌ No Kodex account linked to this Telegram.");
      }
      return NextResponse.json({ ok: true });
    }

    // Unknown command
    await sendBotMessage(chatId, "Available commands:\n\n/status — Check your connection\n/disconnect — Unlink your account");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

async function sendBotMessage(chatId: string, text: string) {
  const settings = await prisma.appSettings.findFirst();
  if (!settings?.telegramBotToken) return;

  await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}
