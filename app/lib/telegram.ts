import { prisma } from "./prisma";
import { getTgMessages } from "./telegram-i18n";

// ─── CONFIG ─────────────────────────────────────────────
async function getBotToken(): Promise<string | null> {
  const settings = await prisma.appSettings.findFirst();
  return settings?.telegramBotToken || null;
}

// ─── HANDLE TELEGRAM ERRORS ─────────────────────────────
async function handleTelegramError(res: Response, chatId: string) {
  try {
    const err = await res.json();
    console.error(`Telegram send error to ${chatId}:`, err.description || JSON.stringify(err));
    if (err.error_code === 403 || err.error_code === 400) {
      try {
        await prisma.user.updateMany({
          where: { telegramChatId: chatId },
          data: { telegramChatId: null },
        });
        console.log(`Removed invalid telegramChatId: ${chatId}`);
      } catch (e) {
        console.error("Failed to remove invalid chatId:", e);
      }
    }
  } catch {
    console.error(`Telegram send failed to ${chatId}: HTTP ${res.status}`);
  }
}

// ─── SEND MESSAGE TO ONE USER ───────────────────────────
async function sendMessageToChat(token: string, chatId: string, text: string) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });

  if (!res.ok) await handleTelegramError(res, chatId);
}

// ─── SEND PHOTO WITH CAPTION TO ONE USER ────────────────
async function sendPhotoToChat(token: string, chatId: string, photoUrl: string, caption: string) {
  const url = `https://api.telegram.org/bot${token}/sendPhoto`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption,
      parse_mode: "HTML",
    }),
  });

  if (!res.ok) {
    // Fallback to text message if photo fails
    console.error(`Photo send failed for ${chatId}, falling back to text`);
    await sendMessageToChat(token, chatId, caption);
  }
}

// ─── GET ACTIVE SUBSCRIBERS WITH TELEGRAM + LANGUAGE ────
interface TelegramUser {
  telegramChatId: string;
  language: string;
}

async function getActiveSubscribersWithTelegram(): Promise<TelegramUser[]> {
  const now = new Date();

  // Users with active subscription AND telegram linked
  const subscribedUsers = await prisma.user.findMany({
    where: {
      telegramChatId: { not: null },
      role: "CLIENT",
      subscriptions: {
        some: { status: "ACTIVE" },
      },
    },
    select: { telegramChatId: true, language: true },
  });

  // Users in trial AND telegram linked
  const trialUsers = await prisma.user.findMany({
    where: {
      telegramChatId: { not: null },
      role: "CLIENT",
      trialEndsAt: { gt: now },
      subscriptions: {
        none: { status: "ACTIVE" },
      },
    },
    select: { telegramChatId: true, language: true },
  });

  const seen = new Set<string>();
  const users: TelegramUser[] = [];

  for (const u of [...subscribedUsers, ...trialUsers]) {
    if (u.telegramChatId && !seen.has(u.telegramChatId)) {
      seen.add(u.telegramChatId);
      users.push({ telegramChatId: u.telegramChatId, language: u.language || "EN" });
    }
  }

  return users;
}

// ─── SEND BATCH WITH RATE LIMITING ──────────────────────
async function sendBatch(token: string, messages: { chatId: string; text: string; photoUrl?: string }[]) {
  const BATCH_SIZE = 20;
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((m) =>
      m.photoUrl
        ? sendPhotoToChat(token, m.chatId, m.photoUrl, m.text)
        : sendMessageToChat(token, m.chatId, m.text)
    ));
    if (i + BATCH_SIZE < messages.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

// ─── SEND CALL ──────────────────────────────────────────
export async function sendCallToTelegram(call: {
  pair: string;
  entryMin: number;
  entryMax: number;
  stopLoss: number;
  targets: { rank: number; price: number }[];
}) {
  const token = await getBotToken();
  if (!token) return;

  const users = await getActiveSubscribersWithTelegram();
  if (users.length === 0) return;

  console.log(`Sending call ${call.pair} to ${users.length} subscribers`);

  const avgEntry = (call.entryMin + call.entryMax) / 2;

  const messages = users.map((user) => {
    const t = getTgMessages(user.language);
    const tps = call.targets.map((tp) => {
      const pct = ((tp.price - avgEntry) / avgEntry * 100).toFixed(1);
      const sign = tp.price >= avgEntry ? "+" : "";
      return `  🎯 TP${tp.rank}: <b>${tp.price}</b> (${sign}${pct}%)`;
    }).join("\n");

    const slPct = ((call.stopLoss - avgEntry) / avgEntry * 100).toFixed(1);

    const text =
      `🚀 <b>${t.newSignal}</b>\n\n` +
      `📊 <b>${call.pair}</b>\n\n` +
      `💰 ${t.entry}: <b>${call.entryMin} — ${call.entryMax}</b>\n\n` +
      `${t.targets}:\n${tps}\n\n` +
      `🛑 ${t.stopLoss}: <b>${call.stopLoss}</b> (${slPct}%)\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `<b>KODEX</b> — ${t.cryptoSignals}`;

    return { chatId: user.telegramChatId, text };
  });

  await sendBatch(token, messages);
}

// ─── SEND NEWS ──────────────────────────────────────────
export async function sendNewsToTelegram(news: {
  title: string;
  description: string;
  imageUrl?: string | null;
  titleFr?: string | null;
  titleEn?: string | null;
  titleEs?: string | null;
  titleTr?: string | null;
  descriptionFr?: string | null;
  descriptionEn?: string | null;
  descriptionEs?: string | null;
  descriptionTr?: string | null;
}) {
  const token = await getBotToken();
  if (!token) return;

  const users = await getActiveSubscribersWithTelegram();
  if (users.length === 0) return;

  console.log(`Sending news to ${users.length} subscribers`);

  const messages = users.map((user) => {
    const t = getTgMessages(user.language);
    const lang = user.language.toUpperCase();

    // Use translated content if available, fallback to default
    let title = news.title;
    let description = news.description;

    if (lang === "FR" && news.titleFr) { title = news.titleFr; description = news.descriptionFr || description; }
    else if (lang === "EN" && news.titleEn) { title = news.titleEn; description = news.descriptionEn || description; }
    else if (lang === "ES" && news.titleEs) { title = news.titleEs; description = news.descriptionEs || description; }
    else if (lang === "TR" && news.titleTr) { title = news.titleTr; description = news.descriptionTr || description; }

    // Caption limit for photos is 1024 chars, so keep it shorter
    const descSnippet = description.slice(0, 200) + (description.length > 200 ? "..." : "");

    const text =
      `📰 <b>${t.news}</b>\n\n` +
      `<b>${title}</b>\n\n` +
      `${descSnippet}\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `<b>KODEX</b> — ${t.cryptoNews}`;

    // Build full image URL for Telegram (needs absolute URL)
    let photoUrl: string | undefined;
    if (news.imageUrl) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      photoUrl = news.imageUrl.startsWith("http") ? news.imageUrl : `${appUrl}${news.imageUrl}`;
    }

    return { chatId: user.telegramChatId, text, photoUrl };
  });

  await sendBatch(token, messages);
}

// ─── SEND TP REACHED ────────────────────────────────────
export async function sendTpReachedToTelegram(call: {
  pair: string;
  tpRank: number;
  tpPrice: number;
  entryMin: number;
  entryMax: number;
}) {
  const token = await getBotToken();
  if (!token) return;

  const users = await getActiveSubscribersWithTelegram();
  if (users.length === 0) return;

  console.log(`Sending TP${call.tpRank} reached for ${call.pair} to ${users.length} subscribers`);

  const avgEntry = (call.entryMin + call.entryMax) / 2;
  const pct = ((call.tpPrice - avgEntry) / avgEntry * 100).toFixed(1);
  const sign = call.tpPrice >= avgEntry ? "+" : "";

  const messages = users.map((user) => {
    const t = getTgMessages(user.language);

    const text =
      `✅ <b>${t.targetReached}</b>\n\n` +
      `📊 <b>${call.pair}</b>\n` +
      `🎯 TP${call.tpRank}: <b>${call.tpPrice}</b> (${sign}${pct}%) ✅\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `<b>KODEX</b> — ${t.cryptoSignals}`;

    return { chatId: user.telegramChatId, text };
  });

  await sendBatch(token, messages);
}

// ─── SEND TO SINGLE USER ────────────────────────────────
export async function sendToUser(userId: string, text: string) {
  const token = await getBotToken();
  if (!token) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramChatId: true },
  });

  if (!user?.telegramChatId) return;

  await sendMessageToChat(token, user.telegramChatId, text);
}
