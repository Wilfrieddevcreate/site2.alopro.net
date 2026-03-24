"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "@/app/i18n/navigation";
import { useLocale } from "next-intl";
import FlagIcon from "./FlagIcon";

const LANGUAGES = [
  { code: "fr", name: "Français", country: "FR" },
  { code: "en", name: "English", country: "GB" },
  { code: "es", name: "Español", country: "ES" },
  { code: "tr", name: "Türkçe", country: "TR" },
] as const;

export default function LanguageSelector({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const selected = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale as "fr" | "en" | "es" | "tr" });
    setOpen(false);
  }

  const isDark = variant === "dark";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
          isDark
            ? "border-white/20 text-white hover:bg-white/10"
            : "border-gray-300 text-gray-700 hover:bg-gray-100"
        }`}
      >
        <FlagIcon code={selected.country} size="sm" />
        <span>{selected.code.toUpperCase()}</span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute right-0 z-50 mt-2 w-44 rounded-lg border py-1 shadow-xl backdrop-blur-sm ${
            isDark
              ? "border-white/10 bg-gray-900/95"
              : "border-gray-200 bg-white"
          }`}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLocale(lang.code)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isDark
                  ? `hover:bg-white/10 ${locale === lang.code ? "text-primary" : "text-white"}`
                  : `hover:bg-gray-100 ${locale === lang.code ? "text-primary" : "text-gray-700"}`
              }`}
            >
              <FlagIcon code={lang.country} size="sm" />
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
