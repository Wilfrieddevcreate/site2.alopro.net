import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import { prisma } from "@/app/lib/prisma";
import { sendPushToAll } from "@/app/lib/push";
import { sendNewsToTelegram } from "@/app/lib/telegram";
import { notifyBroadcast } from "@/app/lib/notifications";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(request.url);
  const skip = parseInt(url.searchParams.get("skip") || "0");
  const take = parseInt(url.searchParams.get("take") || "10");

  const [items, total] = await Promise.all([
    prisma.news.findMany({
      skip, take,
      orderBy: { createdAt: "desc" },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.news.count(),
  ]);

  return NextResponse.json({ items, total });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { title, description, imageUrls, titleFr, descriptionFr, titleEs, descriptionEs, titleTr, descriptionTr } = await request.json();
    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json({ error: "At least one image is required" }, { status: 400 });
    }

    const news = await prisma.news.create({
      data: {
        title, description,
        imageUrl: imageUrls[0], // First image as main
        active: true,
        titleFr: titleFr || null, descriptionFr: descriptionFr || null,
        titleEs: titleEs || null, descriptionEs: descriptionEs || null,
        titleTr: titleTr || null, descriptionTr: descriptionTr || null,
        images: {
          create: imageUrls.map((url: string, i: number) => ({ url, sortOrder: i })),
        },
      },
      include: { images: true },
    });

    // Notifications
    const newsLink = `/dashboard?tab=news&newsId=${news.id}`;
    notifyBroadcast(`New Article: ${title}`, description.slice(0, 100) + (description.length > 100 ? "..." : ""), "news", newsLink).catch(console.error);
    sendPushToAll({ title: "New Article", message: title, url: newsLink }).catch(console.error);
    sendNewsToTelegram({
      title, description,
      images: imageUrls || [],
      imageUrl: imageUrls[0] || null,
      titleFr: titleFr || null, titleEn: title, titleEs: titleEs || null, titleTr: titleTr || null,
      descriptionFr: descriptionFr || null, descriptionEn: description, descriptionEs: descriptionEs || null, descriptionTr: descriptionTr || null,
    }).catch(console.error);

    return NextResponse.json({ news });
  } catch (err) {
    console.error("Create news error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await request.json();
    await prisma.news.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete news error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id, active } = await request.json();
    await prisma.news.update({ where: { id }, data: { active } });
    return NextResponse.json({ message: "Updated" });
  } catch (err) {
    console.error("Update news error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
