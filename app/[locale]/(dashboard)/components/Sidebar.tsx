"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/app/i18n/navigation";

// visibility: "all" = always show, "signals" = show for trial + signals, "managed" = show for trial + managed
const NAV_ITEMS = [
  { key: "home", href: "/dashboard", visibility: "all", icon: "M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" },
  { key: "tutorials", href: "/dashboard/tutorials", visibility: "all", icon: "M21 12a9 9 0 11-18 0 9 9 0 0118 0zM15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" },
  { key: "managed", href: "/dashboard/managed", visibility: "managed", icon: "M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495" },
  { key: "affiliation", href: "/dashboard/affiliation", visibility: "all", icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" },
  { key: "subscription", href: "/dashboard/subscription", visibility: "all", icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" },
  { key: "invoices", href: "/dashboard/invoices", visibility: "all", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
  { key: "settings", href: "/dashboard/settings", visibility: "all", icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

function SidebarContent({ onNavigate, subscriptionType }: { onNavigate?: () => void; subscriptionType?: string | null }) {
  const t = useTranslations("dashboard.nav");
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  // Filter nav items based on subscription type
  // Trial (no subscription) = signals only, no managed
  // SIGNALS subscription = signals only, no managed
  // MANAGED subscription = signals + managed
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.visibility === "all") return true;
    if (item.visibility === "managed") {
      // Only show managed menu if user has MANAGED subscription
      return subscriptionType === "MANAGED";
    }
    return true;
  });

  return (
    <div className="relative z-10 flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-center py-7 px-6">
        <Link href="/dashboard" onClick={onNavigate}>
          <Image src="/assets/images/logo_kodex.png" alt="Kodex" width={120} height={40} />
        </Link>
      </div>

      <div className="mx-4 h-px bg-white/10" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <svg className={`h-5 w-5 shrink-0 transition-colors ${isActive ? "text-white" : "text-white/30 group-hover:text-white/60"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5">
        <div className="mx-1 h-px bg-white/10 mb-3" />
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400/70 transition-all hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
        >
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          {t("logout") || "Sign out"}
        </button>
      </div>
    </div>
  );
}

function SidebarShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <aside className={`relative overflow-hidden text-white bg-black border-r border-white/5 ${className}`}>
      {children}
    </aside>
  );
}

export default function Sidebar({ subscriptionType }: { subscriptionType?: string | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3.5 left-3.5 z-50 rounded-xl bg-black/80 backdrop-blur-sm p-2.5 text-white shadow-lg lg:hidden"
        aria-label="Open menu"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 ease-out lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarShell className="flex h-full w-full flex-col">
          <button onClick={() => setMobileOpen(false)} className="absolute top-5 right-4 z-20 text-white/40 hover:text-white transition-colors" aria-label="Close menu">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <SidebarContent onNavigate={() => setMobileOpen(false)} subscriptionType={subscriptionType} />
        </SidebarShell>
      </div>

      {/* Desktop sidebar */}
      <SidebarShell className="hidden lg:flex h-full w-72 flex-col">
        <SidebarContent subscriptionType={subscriptionType} />
      </SidebarShell>
    </>
  );
}
