"use client";

import { Link } from "@/app/i18n/navigation";
import Image from "next/image";

interface CallData {
  pair: string;
  entryMin: number;
  entryMax: number;
  stopLoss: number;
  active: boolean;
  targets: { rank: number; price: number; reached: boolean }[];
  createdAt: string;
}

interface NewsData {
  title: string;
  description: string;
  imageUrl: string;
  createdAt: string;
}

interface Props {
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
  };
  relatedCall: CallData | null;
  relatedNews: NewsData | null;
}

export default function NotificationDetail({ notification, relatedCall, relatedNews }: Props) {
  const typeStyles: Record<string, { bg: string; text: string }> = {
    call: { bg: "bg-primary/10", text: "text-primary" },
    news: { bg: "bg-violet-500/10", text: "text-violet-400" },
    system: { bg: "bg-amber-500/10", text: "text-amber-400" },
    info: { bg: "bg-white/5", text: "text-white/40" },
  };

  const style = typeStyles[notification.type] || typeStyles.info;

  return (
    <div className="pt-8 lg:pt-0 max-w-3xl">
      {/* Back button */}
      <Link href="/dashboard/notifications" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors mb-6">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to notifications
      </Link>

      {/* Notification header */}
      <div className="card-dark p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.bg}`}>
            <span className={`text-sm font-bold uppercase ${style.text}`}>{notification.type.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>{notification.type}</span>
            <h1 className="text-lg font-bold text-white mt-1">{notification.title}</h1>
            <p className="text-sm text-white/40 mt-2 leading-relaxed">{notification.message}</p>
            <p className="text-xs text-white/15 mt-3">
              {new Date(notification.createdAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} at {new Date(notification.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      </div>

      {/* Related Call */}
      {relatedCall && (
        <div className="card-dark p-6">
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Related Signal</h2>

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold text-white">{relatedCall.pair}</span>
                <div className="text-xs text-white/25">{new Date(relatedCall.createdAt).toLocaleDateString("en-GB")}</div>
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${relatedCall.active ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-white/30"}`}>
              {relatedCall.active ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Entry */}
          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 mb-4">
            <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-1">Entry</div>
            <div className="text-base font-bold text-white">{relatedCall.entryMin} — {relatedCall.entryMax}</div>
          </div>

          {/* Targets */}
          <div className="space-y-2 mb-4">
            {relatedCall.targets.map((tp) => (
              <div key={tp.rank} className={`flex items-center justify-between rounded-xl p-3 ${tp.reached ? "bg-emerald-500/5 border border-emerald-500/15" : "bg-white/[0.02] border border-white/5"}`}>
                <span className={`text-sm font-semibold ${tp.reached ? "text-emerald-400" : "text-white/60"}`}>TP{tp.rank}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${tp.reached ? "text-emerald-400" : "text-white"}`}>{tp.price}</span>
                  {tp.reached && (
                    <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Stop Loss */}
          <div className="rounded-xl bg-red-500/5 border border-red-500/15 p-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-red-400">Stop Loss</span>
            <span className="text-sm font-bold text-red-400">{relatedCall.stopLoss}</span>
          </div>
        </div>
      )}

      {/* Related News */}
      {relatedNews && (
        <div className="card-dark overflow-hidden">
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider px-6 pt-6 mb-4">Related Article</h2>

          {relatedNews.imageUrl && (
            <div className="relative h-48 mx-6 mb-4 rounded-xl overflow-hidden">
              <Image src={relatedNews.imageUrl} alt={relatedNews.title} fill className="object-cover" />
            </div>
          )}

          <div className="px-6 pb-6">
            <h3 className="text-lg font-bold text-white mb-2">{relatedNews.title}</h3>
            <p className="text-sm text-white/40 leading-relaxed">{relatedNews.description}</p>
            <p className="text-xs text-white/15 mt-3">{new Date(relatedNews.createdAt).toLocaleDateString("en-GB")}</p>
          </div>
        </div>
      )}

      {/* No related content */}
      {!relatedCall && !relatedNews && notification.type !== "system" && notification.type !== "info" && (
        <div className="card-dark p-6 text-center">
          <p className="text-sm text-white/25">The related content is no longer available.</p>
        </div>
      )}
    </div>
  );
}
