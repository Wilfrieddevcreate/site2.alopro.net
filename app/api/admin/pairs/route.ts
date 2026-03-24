import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(request.url);
  const skip = parseInt(url.searchParams.get("skip") || "0");
  const take = parseInt(url.searchParams.get("take") || "10");
  const search = url.searchParams.get("search") || "";

  const where = search ? {
    OR: [
      { base: { contains: search.toUpperCase() } },
      { quote: { contains: search.toUpperCase() } },
    ],
  } : {};

  const [pairs, total] = await Promise.all([
    prisma.tradingPair.findMany({
      where,
      orderBy: [{ base: "asc" }, { quote: "asc" }],
      include: { _count: { select: { calls: true } } },
      skip,
      take,
    }),
    prisma.tradingPair.count({ where }),
  ]);

  return NextResponse.json({ pairs, total, hasMore: skip + take < total });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { base, quote } = await request.json();
    if (!base || !quote) {
      return NextResponse.json({ error: "Base and quote are required" }, { status: 400 });
    }

    const existing = await prisma.tradingPair.findUnique({
      where: { base_quote: { base: base.toUpperCase(), quote: quote.toUpperCase() } },
    });
    if (existing) {
      return NextResponse.json({ error: "Pair already exists" }, { status: 400 });
    }

    const pair = await prisma.tradingPair.create({
      data: { base: base.toUpperCase(), quote: quote.toUpperCase() },
    });

    return NextResponse.json({ pair });
  } catch (err) {
    console.error("Create pair error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await request.json();
    await prisma.tradingPair.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete pair error:", err);
    return NextResponse.json({ error: "Cannot delete pair with existing calls" }, { status: 400 });
  }
}
