"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/app/i18n/navigation";
import LanguageSelector from "../../components/LanguageSelector";
import NotificationBell from "../../components/NotificationBell";

interface DashboardHeaderProps {
  userName: string;
}

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  const t = useTranslations("dashboard.header");
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="flex h-16 items-center justify-end border-b border-white/5 bg-transparent px-4 sm:px-8">
      <div className="flex items-center gap-3">
        <LanguageSelector />
        <NotificationBell />

        {/* User avatar + name */}
        <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-white/10 px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {userName.charAt(0)}
          </div>
          <span className="text-sm font-medium text-white/70">{userName}</span>
        </div>

      </div>
    </header>
  );
}
