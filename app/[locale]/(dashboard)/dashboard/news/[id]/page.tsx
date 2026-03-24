import { notFound, redirect } from "next/navigation";
import { getSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { getLocale } from "next-intl/server";
import NewsDetailClient from "./NewsDetailClient";

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const locale = await getLocale();

  const news = await prisma.news.findUnique({
    where: { id, active: true },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  if (!news) notFound();

  // Pick the right language
  const localeMap: Record<string, { title?: string | null; desc?: string | null }> = {
    fr: { title: news.titleFr, desc: news.descriptionFr },
    es: { title: news.titleEs, desc: news.descriptionEs },
    tr: { title: news.titleTr, desc: news.descriptionTr },
  };

  const localized = localeMap[locale] || {};
  const title = localized.title || news.title;
  const description = localized.desc || news.description;
  const images = news.images.length > 0
    ? news.images.map((img) => img.url)
    : news.imageUrl ? [news.imageUrl] : [];

  return (
    <NewsDetailClient
      title={title}
      description={description}
      images={images}
      date={news.createdAt.toISOString()}
    />
  );
}
