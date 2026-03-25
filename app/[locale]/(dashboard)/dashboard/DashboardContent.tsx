"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import NewsDetailModal from "@/app/[locale]/components/NewsDetailModal";
import CustomSelect from "@/app/[locale]/components/CustomSelect";

interface CallData {
  id: string;
  pair: string;
  entryMin: number;
  entryMax: number;
  stopLoss: number;
  stopLossReached: boolean;
  active: boolean;
  targets: { rank: number; price: number; reached: boolean }[];
  createdAt: string;
}

interface NewsData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: string;
}

interface DashboardContentProps {
  firstName: string;
  isTrialActive: boolean;
  hasActiveSubscription: boolean;
  trialEndsAt: string | null;
  subscriptionType: string | null;
  activeCalls: CallData[];
  latestNews: NewsData[];
}

export default function DashboardContent({
  firstName,
  isTrialActive,
  hasActiveSubscription,
  trialEndsAt,
  subscriptionType,
  activeCalls,
  latestNews,
}: DashboardContentProps) {
  const t = useTranslations("dashboard.home");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const callIdParam = searchParams.get("callId");
  const newsIdParam = searchParams.get("newsId");
  const [activeTab, setActiveTab] = useState<"calls" | "news">(tabParam === "news" ? "news" : "calls");
  const [highlightId, setHighlightId] = useState<string | null>(callIdParam || newsIdParam || null);
  const [pairFilter, setPairFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedNews, setSelectedNews] = useState<{ id: string; title: string; description: string; images: string[]; date: string } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  // Auto-open news detail if newsId in URL
  useEffect(() => {
    if (newsIdParam && tabParam === "news") {
      const news = latestNews.find((n) => n.id === newsIdParam);
      if (news) openNewsDetail(news);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsIdParam]);

  // Scroll to highlighted call
  useEffect(() => {
    if (highlightId) {
      setTimeout(() => {
        const el = document.getElementById(`item-${highlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-primary", "ring-offset-2", "ring-offset-black");
          setTimeout(() => {
            el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "ring-offset-black");
            setHighlightId(null);
          }, 3000);
        }
      }, 300);
    }
  }, [highlightId, activeTab]);

  async function openNewsDetail(n: NewsData) {
    setLoadingDetail(n.id);
    try {
      const res = await fetch(`/api/user/news/${n.id}?locale=${locale}`);
      const data = await res.json();
      setSelectedNews({
        id: n.id,
        title: data.title || n.title,
        description: data.description || n.description,
        images: data.images || (n.imageUrl ? [n.imageUrl] : []),
        date: n.createdAt,
      });
    } catch {
      setSelectedNews({
        id: n.id, title: n.title, description: n.description,
        images: n.imageUrl ? [n.imageUrl] : [], date: n.createdAt,
      });
    }
    setLoadingDetail(null);
  }

  const isManagedOnly = hasActiveSubscription && subscriptionType === "MANAGED";

  // Get unique pairs for filter
  const uniquePairs = Array.from(new Set(activeCalls.map((c) => c.pair))).sort();

  // Filter calls
  const filteredCalls = activeCalls.filter((c) => {
    if (pairFilter !== "all" && c.pair !== pairFilter) return false;
    if (statusFilter === "active" && !c.active) return false;
    if (statusFilter === "inactive" && c.active) return false;
    return true;
  });

  return (
    <div className="pt-8 lg:pt-0">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {t("welcome")}, {firstName}
        </h1>
        {hasActiveSubscription && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {t("subscribedBadge")} — {subscriptionType === "MANAGED" ? "Managed Trading" : "Signals"}
            </span>
          </div>
        )}
      </div>

      {/* Managed Trading user — no calls/news, show status */}
      {isManagedOnly && (
        <div className="space-y-4">
          <div className="card-dark p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Managed Trading</h2>
                <p className="text-sm text-white/40 leading-relaxed">Our expert team is managing your trades. Make sure your exchange account is connected to get started.</p>
              </div>
            </div>
          </div>
          <a href="/dashboard/managed" className="card-dark p-5 flex items-center justify-between group hover:border-primary/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/15 transition-colors">
                <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-white">Manage exchange connection</span>
            </div>
            <svg className="h-5 w-5 text-white/15 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </a>
        </div>
      )}

      {/* Tabs — only for trial and SIGNALS users */}
      {!isManagedOnly && (
      <>
      {/* Browser-style tabs */}
      <div className="relative mb-0">
        <div className="flex items-end">
          {/* Calls tab */}
          <button
            onClick={() => setActiveTab("calls")}
            className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all rounded-t-lg ${
              activeTab === "calls"
                ? "bg-primary text-white border-t border-l border-r border-primary -mb-px z-10 shadow-lg shadow-primary/20"
                : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22" />
            </svg>
            Calls
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
              activeTab === "calls" ? "bg-white/20 text-white" : "bg-white/5 text-white/25"
            }`}>
              {filteredCalls.length}
            </span>
          </button>

          {/* News tab */}
          <button
            onClick={() => setActiveTab("news")}
            className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all rounded-t-lg ${
              activeTab === "news"
                ? "bg-primary text-white border-t border-l border-r border-primary -mb-px z-10 shadow-lg shadow-primary/20"
                : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" />
            </svg>
            News
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
              activeTab === "news" ? "bg-white/20 text-white" : "bg-white/5 text-white/25"
            }`}>
              {latestNews.length}
            </span>
          </button>

          {/* Filler line */}
          <div className="flex-1 border-b border-white/10" />
        </div>
      </div>

      {/* Tab content panel */}
      <div className="pt-5 mb-6">

      {/* Calls tab */}
      {activeTab === "calls" && (
        <div>
          {/* Filters */}
          <div className="flex gap-3 mb-5">
            <div className="flex-1 min-w-0 max-w-[200px]">
              <CustomSelect
                options={[
                  { value: "all", label: "All pairs" },
                  ...uniquePairs.map((pair) => ({ value: pair, label: pair })),
                ]}
                value={{ value: pairFilter, label: pairFilter === "all" ? "All pairs" : pairFilter }}
                onChange={(opt) => setPairFilter(opt?.value || "all")}
                placeholder="Filter by pair"
                isSearchable
              />
            </div>

            <div className="flex-1 min-w-0 max-w-[160px]">
              <CustomSelect
                options={[
                  { value: "all", label: "All status" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                value={{ value: statusFilter, label: statusFilter === "all" ? "All status" : statusFilter === "active" ? "Active" : "Inactive" }}
                onChange={(opt) => setStatusFilter((opt?.value || "all") as "all" | "active" | "inactive")}
                placeholder="Filter by status"
                isSearchable={false}
              />
            </div>
          </div>

          {filteredCalls.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCalls.map((call) => (
                <div key={call.id} id={`item-${call.id}`} className="card-dark p-5 transition-all duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22" />
                        </svg>
                      </div>
                      <span className="text-base font-bold text-white">{call.pair}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${call.active ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-white/25"}`}>
                        {call.active ? "Active" : "Closed"}
                      </span>
                      <span className="text-xs text-white/25">{new Date(call.createdAt).toLocaleDateString("en-GB")}</span>
                    </div>
                  </div>

                  <div className="mb-4 rounded-xl bg-white/5 p-3.5">
                    <div className="text-xs font-medium text-white/30 uppercase tracking-wider mb-1">{t("entry")}</div>
                    <div className="text-sm font-bold text-white">{call.entryMin} — {call.entryMax}</div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {call.targets.map((tp) => {
                      const entryMid = (call.entryMin + call.entryMax) / 2;
                      const gainPct = ((tp.price - entryMid) / entryMid * 100).toFixed(1);
                      return (
                        <div key={tp.rank} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${tp.reached ? "bg-emerald-500/10" : "bg-white/[0.02]"}`}>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${tp.reached ? "text-emerald-400" : "text-white/40"}`}>
                              TP{tp.rank}
                            </span>
                            <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${tp.reached ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-white/25"}`}>
                              +{gainPct}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${tp.reached ? "text-emerald-400" : "text-white/70"}`}>{tp.price}</span>
                            <span className={`text-xs ${tp.reached ? "text-emerald-400/60" : "text-white/30"}`}>({((tp.price - (call.entryMin + call.entryMax) / 2) / ((call.entryMin + call.entryMax) / 2) * 100).toFixed(1)}%)</span>
                            {tp.reached && (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm ${call.stopLossReached ? "bg-red-500/20 border border-red-500/30" : "bg-red-500/10"}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-red-400">{t("stopLoss")}</span>
                      {call.stopLossReached && (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
                          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-400">{call.stopLoss}</span>
                      <span className="text-xs text-red-400/60">({(((call.stopLoss - (call.entryMin + call.entryMax) / 2) / ((call.entryMin + call.entryMax) / 2)) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                <svg className="h-7 w-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22" />
                </svg>
              </div>
              <p className="text-sm text-white/30">{t("noCalls")}</p>
            </div>
          )}
        </div>
      )}

      {/* News tab */}
      {activeTab === "news" && (
        <div>
          {latestNews.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {latestNews.map((news) => (
                <div key={news.id} id={`item-${news.id}`} onClick={() => openNewsDetail(news)} className="card-dark overflow-hidden group cursor-pointer hover:border-primary/20 transition-all duration-500">
                  <div className="h-44 bg-white/5 overflow-hidden relative">
                    <img src={news.imageUrl} alt={news.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    {loadingDetail === news.id && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-white leading-snug">{news.title}</h3>
                    <p className="mt-2 text-sm text-white/40 line-clamp-2 leading-relaxed">{news.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-white/20">{new Date(news.createdAt).toLocaleDateString("en-GB")}</p>
                      <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">Read more →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                <svg className="h-7 w-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" />
                </svg>
              </div>
              <p className="text-sm text-white/30">{t("noNews")}</p>
            </div>
          )}
        </div>
      )}
      </div>{/* Close tab content panel */}
      </>
      )}

      {/* News Detail Modal */}
      <NewsDetailModal news={selectedNews} onClose={() => setSelectedNews(null)} />
    </div>
  );
}
