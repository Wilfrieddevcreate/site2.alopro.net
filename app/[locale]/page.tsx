import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/app/i18n/navigation";
import LanguageSelector from "./components/LanguageSelector";

export default function Home() {
  const t = useTranslations("home");

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Background */}
      <Image
        src="/assets/images/auth-bg.jpg.jpeg"
        alt="Background"
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/50 to-black/80" />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-5 py-4 sm:px-10 sm:py-5">
        <Image
          src="/assets/images/logo_kodex.png"
          alt="Kodex"
          width={110}
          height={36}
        />
        <LanguageSelector />
      </header>

      {/* Content */}
      <div className="relative z-10 flex h-[calc(100%-64px)] sm:h-[calc(100%-76px)] flex-col items-center justify-center px-5 sm:px-6 text-center text-white">
        {/* Subtle glow behind title */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />

        <h1 className="relative mb-3 text-3xl font-extrabold tracking-tight sm:mb-4 sm:text-4xl md:text-5xl lg:text-6xl">
          {t("title")}
          <br />
          <span className="text-primary">{t("titleBreak")}</span>
        </h1>

        <p className="relative mb-8 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg">
          {t("subtitle")}
        </p>

        <div className="relative flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4">
          <Link
            href="/register"
            className="btn-glow rounded-xl bg-primary px-10 py-3.5 text-center text-sm font-semibold text-white transition-all hover:bg-primary-hover sm:text-base"
          >
            {t("cta")}
          </Link>
          <Link
            href="/login"
            className="btn-glow-outline rounded-xl border border-white/20 px-10 py-3.5 text-center text-sm font-semibold text-white transition-all hover:bg-white/10 sm:text-base"
          >
            {t("login")}
          </Link>
        </div>
      </div>
    </div>
  );
}
