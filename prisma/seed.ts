import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Admin account
  const adminEmail = "admin@kodex.com";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        firstName: "Admin",
        lastName: "Kodex",
        email: adminEmail,
        phone: "+000000000",
        country: "FR",
        language: "EN",
        passwordHash: "$2b$12$LBG5viHHlTBdVYz7489CH.vpWd0HxQ1mQNPh0kxbLt4ezLCNmzFva",
        role: "ADMIN",
        emailVerified: true,
      },
    });
    console.log("Admin account created: admin@kodex.com");
  }

  // App settings
  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      trialDurationDays: 7,
    },
  });

  // Trading pairs
  const pairs = [
    // Top cryptos / USDT
    { base: "BTC", quote: "USDT" },
    { base: "ETH", quote: "USDT" },
    { base: "SOL", quote: "USDT" },
    { base: "BNB", quote: "USDT" },
    { base: "XRP", quote: "USDT" },
    { base: "ADA", quote: "USDT" },
    { base: "DOGE", quote: "USDT" },
    { base: "AVAX", quote: "USDT" },
    { base: "DOT", quote: "USDT" },
    { base: "MATIC", quote: "USDT" },
    { base: "LINK", quote: "USDT" },
    { base: "UNI", quote: "USDT" },
    { base: "ATOM", quote: "USDT" },
    { base: "LTC", quote: "USDT" },
    { base: "FIL", quote: "USDT" },
    { base: "NEAR", quote: "USDT" },
    { base: "APT", quote: "USDT" },
    { base: "ARB", quote: "USDT" },
    { base: "OP", quote: "USDT" },
    { base: "SUI", quote: "USDT" },
    { base: "SEI", quote: "USDT" },
    { base: "TIA", quote: "USDT" },
    { base: "INJ", quote: "USDT" },
    { base: "PEPE", quote: "USDT" },
    { base: "SHIB", quote: "USDT" },
    { base: "WIF", quote: "USDT" },
    { base: "BONK", quote: "USDT" },
    { base: "FET", quote: "USDT" },
    { base: "RENDER", quote: "USDT" },
    { base: "TRX", quote: "USDT" },
    { base: "TON", quote: "USDT" },
    { base: "ALGO", quote: "USDT" },
    { base: "VET", quote: "USDT" },
    { base: "SAND", quote: "USDT" },
    { base: "MANA", quote: "USDT" },
    { base: "AAVE", quote: "USDT" },
    { base: "MKR", quote: "USDT" },
    { base: "CRV", quote: "USDT" },
    { base: "RUNE", quote: "USDT" },
    { base: "GALA", quote: "USDT" },
    { base: "IMX", quote: "USDT" },
    { base: "STX", quote: "USDT" },
    { base: "HBAR", quote: "USDT" },
    { base: "EOS", quote: "USDT" },
    { base: "XLM", quote: "USDT" },
    { base: "THETA", quote: "USDT" },
    { base: "FTM", quote: "USDT" },
    { base: "ICP", quote: "USDT" },
    { base: "EGLD", quote: "USDT" },
    { base: "ENS", quote: "USDT" },
    // BTC pairs
    { base: "ETH", quote: "BTC" },
    { base: "SOL", quote: "BTC" },
    { base: "BNB", quote: "BTC" },
    { base: "XRP", quote: "BTC" },
    { base: "ADA", quote: "BTC" },
    { base: "DOGE", quote: "BTC" },
    { base: "LINK", quote: "BTC" },
    // ETH pairs
    { base: "SOL", quote: "ETH" },
    { base: "LINK", quote: "ETH" },
    { base: "UNI", quote: "ETH" },
    // USDC pairs
    { base: "BTC", quote: "USDC" },
    { base: "ETH", quote: "USDC" },
    { base: "SOL", quote: "USDC" },
    // BUSD pairs
    { base: "BTC", quote: "BUSD" },
    { base: "ETH", quote: "BUSD" },
  ];

  for (const pair of pairs) {
    await prisma.tradingPair.upsert({
      where: { base_quote: { base: pair.base, quote: pair.quote } },
      update: {},
      create: pair,
    });
  }

  const btcPair = await prisma.tradingPair.findUnique({ where: { base_quote: { base: "BTC", quote: "USDT" } } });
  const ethPair = await prisma.tradingPair.findUnique({ where: { base_quote: { base: "ETH", quote: "USDT" } } });
  const solPair = await prisma.tradingPair.findUnique({ where: { base_quote: { base: "SOL", quote: "USDT" } } });
  const bnbPair = await prisma.tradingPair.findUnique({ where: { base_quote: { base: "BNB", quote: "USDT" } } });
  const xrpPair = await prisma.tradingPair.findUnique({ where: { base_quote: { base: "XRP", quote: "USDT" } } });

  // Calls
  const callsData = [
    {
      tradingPairId: btcPair!.id,
      entryMin: 67500,
      entryMax: 68200,
      stopLoss: 65800,
      targets: [
        { rank: 1, price: 70000, reached: true },
        { rank: 2, price: 72500, reached: true },
        { rank: 3, price: 75000, reached: false },
      ],
    },
    {
      tradingPairId: ethPair!.id,
      entryMin: 3450,
      entryMax: 3520,
      stopLoss: 3300,
      targets: [
        { rank: 1, price: 3650, reached: true },
        { rank: 2, price: 3800, reached: false },
        { rank: 3, price: 4000, reached: false },
      ],
    },
    {
      tradingPairId: solPair!.id,
      entryMin: 142,
      entryMax: 148,
      stopLoss: 135,
      targets: [
        { rank: 1, price: 155, reached: false },
        { rank: 2, price: 170, reached: false },
      ],
    },
    {
      tradingPairId: bnbPair!.id,
      entryMin: 580,
      entryMax: 595,
      stopLoss: 560,
      targets: [
        { rank: 1, price: 620, reached: true },
        { rank: 2, price: 650, reached: true },
        { rank: 3, price: 700, reached: true },
      ],
    },
    {
      tradingPairId: xrpPair!.id,
      entryMin: 0.52,
      entryMax: 0.55,
      stopLoss: 0.48,
      targets: [
        { rank: 1, price: 0.60, reached: true },
        { rank: 2, price: 0.68, reached: false },
      ],
    },
  ];

  // Delete existing calls and targets
  await prisma.callTarget.deleteMany();
  await prisma.call.deleteMany();

  for (const callData of callsData) {
    const call = await prisma.call.create({
      data: {
        tradingPairId: callData.tradingPairId,
        entryMin: callData.entryMin,
        entryMax: callData.entryMax,
        stopLoss: callData.stopLoss,
        active: true,
        telegramSent: true,
      },
    });

    for (const target of callData.targets) {
      await prisma.callTarget.create({
        data: {
          callId: call.id,
          rank: target.rank,
          price: target.price,
          reached: target.reached,
        },
      });
    }
  }

  // News
  await prisma.news.deleteMany();

  const newsData = [
    {
      title: "Bitcoin Breaks $70K Resistance",
      description: "Bitcoin has successfully broken through the $70,000 resistance level, signaling a potential new bullish phase. Analysts predict continued upward momentum as institutional interest grows.",
      imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&h=400&fit=crop",
    },
    {
      title: "Ethereum 2.0 Staking Rewards Increase",
      description: "The Ethereum network has seen a significant increase in staking rewards following the latest protocol update. Validators are now earning higher returns.",
      imageUrl: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=600&h=400&fit=crop",
    },
    {
      title: "Solana DeFi Ecosystem Expansion",
      description: "Solana's DeFi ecosystem continues to grow with several new protocols launching this month. TVL has increased by 40% over the past 30 days.",
      imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=400&fit=crop",
    },
    {
      title: "New Crypto Regulations in Europe",
      description: "The European Union has finalized its MiCA framework for cryptocurrency regulation. The new rules will take effect gradually over the next 18 months.",
      imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop",
    },
  ];

  for (const news of newsData) {
    await prisma.news.create({
      data: {
        ...news,
        active: true,
        telegramSent: true,
      },
    });
  }

  // FAQ
  await prisma.faq.deleteMany();

  await prisma.faq.createMany({
    data: [
      { question: "How do I start trading with Kodex signals?", answer: "Simply subscribe to our Signals plan and follow the calls posted on your dashboard. Each call includes entry points, take profit targets, and stop loss levels.", sortOrder: 1 },
      { question: "What is Managed Trading?", answer: "With our Managed Trading plan, our expert traders execute trades on your behalf using your exchange API keys. You just connect your account and we handle the rest.", sortOrder: 2 },
      { question: "How does the referral program work?", answer: "Once approved as an affiliate, you receive a unique referral link and promo code. Share it with friends and earn commissions based on the number of users you refer.", sortOrder: 3 },
    ],
  });

  // Dummy client users
  const bcrypt = await import("bcryptjs");
  const dummyPassword = await bcrypt.default.hash("Test1234!", 12);

  const dummyUsers = [
    { firstName: "Marie", lastName: "Dupont", email: "marie@test.com", phone: "+33612345678", country: "FR", language: "FR", trial: 7 },
    { firstName: "John", lastName: "Smith", email: "john@test.com", phone: "+14155551234", country: "US", language: "EN", trial: 14 },
    { firstName: "Ahmet", lastName: "Yilmaz", email: "ahmet@test.com", phone: "+905551234567", country: "TR", language: "TR", trial: 0 },
    { firstName: "Carlos", lastName: "Garcia", email: "carlos@test.com", phone: "+34612345678", country: "ES", language: "ES", trial: 30 },
    { firstName: "Sophie", lastName: "Martin", email: "sophie@test.com", phone: "+33698765432", country: "FR", language: "FR", trial: -3 },
  ];

  for (const u of dummyUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      const trialEndsAt = u.trial !== 0 ? new Date(Date.now() + u.trial * 86400000) : null;
      const user = await prisma.user.create({
        data: {
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          phone: u.phone,
          country: u.country,
          language: u.language,
          passwordHash: dummyPassword,
          emailVerified: true,
          trialEndsAt,
        },
      });

      // Make Marie an approved affiliate
      if (u.email === "marie@test.com") {
        await prisma.affiliate.create({
          data: {
            userId: user.id,
            status: "APPROVED",
            promoCode: "MARIE10",
            referralLink: "https://kodex.com/ref/MARIE10",
          },
        });
      }

      // Make John referred by Marie
      if (u.email === "john@test.com") {
        const marie = await prisma.user.findUnique({ where: { email: "marie@test.com" } });
        if (marie) {
          await prisma.referral.create({
            data: { referrerId: marie.id, referredUserId: user.id },
          });
        }
      }

      // Make Sophie a pending affiliate
      if (u.email === "sophie@test.com") {
        await prisma.affiliate.create({
          data: { userId: user.id, status: "PENDING" },
        });
      }
    }
  }
  console.log("Dummy users created");

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
