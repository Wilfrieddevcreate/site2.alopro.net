import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") || "en";

  const news = await prisma.news.findFirst({
    where: { id, active: true },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  if (!news) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Localize
  let title = news.title;
  let description = news.description;
  if (locale === "fr" && news.titleFr) { title = news.titleFr; description = news.descriptionFr || news.description; }
  else if (locale === "es" && news.titleEs) { title = news.titleEs; description = news.descriptionEs || news.description; }
  else if (locale === "tr" && news.titleTr) { title = news.titleTr; description = news.descriptionTr || news.description; }

  const images = news.images.length > 0
    ? news.images.map((img) => img.url)
    : news.imageUrl ? [news.imageUrl] : [];

  return NextResponse.json({ title, description, images, date: news.createdAt.toISOString() });
}
