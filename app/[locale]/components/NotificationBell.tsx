"use client";

import { useState, useEffect, useRef } from "react";
import { Link, usePathname } from "@/app/i18n/navigation";

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const notifBase = isAdmin ? "/admin" : "/dashboard/notifications";

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items || data.notifications || []);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // Silently fail
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: "all" }),
    });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const typeIcon: Record<string, string> = {
    call: "text-primary",
    news: "text-violet-400",
    system: "text-amber-400",
    info: "text-white/40",
  };

  // Show only 3 latest in dropdown
  const preview = notifications.slice(0, 3);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center rounded-xl border border-white/10 p-2.5 text-white/50 transition-all hover:bg-white/5 hover:text-white/80"
      >
        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 rounded-2xl border border-white/10 bg-[#141419] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:text-primary-hover transition-colors">
                Mark all read
              </button>
            )}
          </div>

          {/* Preview: 3 latest */}
          <div>
            {preview.length > 0 ? (
              preview.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || (isAdmin ? "/admin" : "/dashboard/notifications")}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-3 border-b border-white/5 transition-colors hover:bg-white/[0.04] ${!n.read ? "bg-white/[0.03]" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? "bg-primary" : "bg-transparent"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-semibold uppercase ${typeIcon[n.type] || "text-white/40"}`}>{n.type}</span>
                        <span className="text-[10px] text-white/20">
                          {new Date(n.createdAt).toLocaleDateString("en-GB")} {new Date(n.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-white leading-snug truncate">{n.title}</p>
                      <p className="text-xs text-white/35 mt-0.5 line-clamp-1">{n.message}</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-white/25">No notifications</div>
            )}
          </div>

          {/* See all button */}
          {notifications.length > 0 && (
            <Link
              href={isAdmin ? "/admin" : "/dashboard/notifications"}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-center text-xs font-semibold text-primary hover:bg-white/[0.03] transition-colors border-t border-white/5"
            >
              View all notifications →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
