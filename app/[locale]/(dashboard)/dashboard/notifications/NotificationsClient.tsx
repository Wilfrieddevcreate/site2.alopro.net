"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "@/app/i18n/navigation";
import toast from "react-hot-toast";

const PAGE_SIZE = 20;

interface NotificationData { id: string; title: string; message: string; type: string; read: boolean; createdAt: string; }

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const pageRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const initialLoaded = useRef(false);

  const fetchNotifications = useCallback(async (page: number, append: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?skip=${page * PAGE_SIZE}&take=${PAGE_SIZE}`);
      const data = await res.json();
      const items: NotificationData[] = data.items || [];
      setUnreadCount(data.unreadCount || 0);
      if (append) setNotifications((prev) => [...prev, ...items]);
      else setNotifications(items);
      setHasMore(items.length === PAGE_SIZE);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!initialLoaded.current) { initialLoaded.current = true; fetchNotifications(0, false); }
  }, [fetchNotifications]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        pageRef.current += 1;
        fetchNotifications(pageRef.current, true);
      }
    }, { threshold: 0.1 });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, fetchNotifications]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: "all" }),
    });
    toast.success("All notifications marked as read");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const typeStyles: Record<string, { bg: string; text: string; icon: string }> = {
    call: { bg: "bg-primary/10", text: "text-primary", icon: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22" },
    news: { bg: "bg-violet-500/10", text: "text-violet-400", icon: "M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" },
    system: { bg: "bg-amber-500/10", text: "text-amber-400", icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281" },
    info: { bg: "bg-white/5", text: "text-white/40", icon: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" },
  };

  return (
    <div className="pt-8 lg:pt-0 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">
          Notifications
          {unreadCount > 0 && <span className="ml-2 text-lg text-white/30">({unreadCount} unread)</span>}
        </h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-medium text-white/40 hover:text-white hover:bg-white/10 transition-all">
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {(["all", "unread"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-xl px-5 py-2.5 text-xs font-semibold transition-all ${filter === f ? "bg-primary text-white shadow-lg shadow-primary/25" : "bg-white/5 text-white/40 border border-white/10 hover:text-white"}`}>
            {f === "all" ? "All" : "Unread"}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((n) => {
            const style = typeStyles[n.type] || typeStyles.info;
            return (
              <Link key={n.id} href={`/dashboard/notifications/${n.id}`}
                className={`card-dark flex items-start gap-4 p-5 transition-all hover:border-white/15 ${!n.read ? "border-l-2 border-l-primary" : ""}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.bg}`}>
                  <svg className={`h-5 w-5 ${style.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>{n.type}</span>
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm font-semibold text-white">{n.title}</p>
                  <p className="text-xs text-white/35 mt-1 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-white/15 mt-2">
                    {new Date(n.createdAt).toLocaleDateString("en-GB")} at {new Date(n.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <svg className="h-4 w-4 text-white/10 shrink-0 mt-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            );
          })}
        </div>
      ) : !loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <svg className="h-7 w-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <p className="text-sm text-white/30">{filter === "unread" ? "No unread notifications" : "No notifications yet"}</p>
        </div>
      ) : null}

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {loading && <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
        </div>
      )}
      {!hasMore && notifications.length > 0 && <p className="text-center text-xs text-white/20 py-4">All notifications loaded</p>}
    </div>
  );
}
