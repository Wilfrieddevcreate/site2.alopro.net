"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/app/i18n/navigation";
import { useSearchParams } from "next/navigation";

function FlagImg({ code }: { code: string; size?: number }) {
  return <span className={`fi fi-${code.toLowerCase()} inline-block w-5 h-4 rounded-sm`} style={{ backgroundSize: "cover" }} />;
}

const COUNTRIES = [
  { code: "AF", name: "Afghanistan" },{ code: "AL", name: "Albania" },{ code: "DZ", name: "Algeria" },
  { code: "AD", name: "Andorra" },{ code: "AO", name: "Angola" },{ code: "AG", name: "Antigua & Barbuda" },
  { code: "AR", name: "Argentina" },{ code: "AM", name: "Armenia" },{ code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },{ code: "AZ", name: "Azerbaijan" },{ code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" },{ code: "BD", name: "Bangladesh" },{ code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" },{ code: "BE", name: "Belgium" },{ code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },{ code: "BT", name: "Bhutan" },{ code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia" },{ code: "BW", name: "Botswana" },{ code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei" },{ code: "BG", name: "Bulgaria" },{ code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },{ code: "KH", name: "Cambodia" },{ code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },{ code: "CV", name: "Cape Verde" },{ code: "CF", name: "Central African Rep." },
  { code: "TD", name: "Chad" },{ code: "CL", name: "Chile" },{ code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },{ code: "KM", name: "Comoros" },{ code: "CG", name: "Congo" },
  { code: "CD", name: "DR Congo" },{ code: "CR", name: "Costa Rica" },{ code: "CI", name: "Côte d'Ivoire" },
  { code: "HR", name: "Croatia" },{ code: "CU", name: "Cuba" },{ code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },{ code: "DK", name: "Denmark" },{ code: "DJ", name: "Djibouti" },
  { code: "DO", name: "Dominican Rep." },{ code: "EC", name: "Ecuador" },{ code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },{ code: "GQ", name: "Equatorial Guinea" },{ code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" },{ code: "SZ", name: "Eswatini" },{ code: "ET", name: "Ethiopia" },
  { code: "FJ", name: "Fiji" },{ code: "FI", name: "Finland" },{ code: "FR", name: "France" },
  { code: "GA", name: "Gabon" },{ code: "GM", name: "Gambia" },{ code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },{ code: "GH", name: "Ghana" },{ code: "GR", name: "Greece" },
  { code: "GT", name: "Guatemala" },{ code: "GN", name: "Guinea" },{ code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },{ code: "HT", name: "Haiti" },{ code: "HN", name: "Honduras" },
  { code: "HU", name: "Hungary" },{ code: "IS", name: "Iceland" },{ code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },{ code: "IR", name: "Iran" },{ code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },{ code: "IL", name: "Israel" },{ code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },{ code: "JP", name: "Japan" },{ code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },{ code: "KE", name: "Kenya" },{ code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },{ code: "LA", name: "Laos" },{ code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },{ code: "LS", name: "Lesotho" },{ code: "LR", name: "Liberia" },
  { code: "LY", name: "Libya" },{ code: "LI", name: "Liechtenstein" },{ code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },{ code: "MG", name: "Madagascar" },{ code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },{ code: "MV", name: "Maldives" },{ code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },{ code: "MR", name: "Mauritania" },{ code: "MU", name: "Mauritius" },
  { code: "MX", name: "Mexico" },{ code: "MD", name: "Moldova" },{ code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" },{ code: "ME", name: "Montenegro" },{ code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },{ code: "MM", name: "Myanmar" },{ code: "NA", name: "Namibia" },
  { code: "NP", name: "Nepal" },{ code: "NL", name: "Netherlands" },{ code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },{ code: "NE", name: "Niger" },{ code: "NG", name: "Nigeria" },
  { code: "MK", name: "North Macedonia" },{ code: "NO", name: "Norway" },{ code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },{ code: "PA", name: "Panama" },{ code: "PG", name: "Papua New Guinea" },
  { code: "PY", name: "Paraguay" },{ code: "PE", name: "Peru" },{ code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },{ code: "PT", name: "Portugal" },{ code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },{ code: "RU", name: "Russia" },{ code: "RW", name: "Rwanda" },
  { code: "SA", name: "Saudi Arabia" },{ code: "SN", name: "Senegal" },{ code: "RS", name: "Serbia" },
  { code: "SL", name: "Sierra Leone" },{ code: "SG", name: "Singapore" },{ code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },{ code: "SO", name: "Somalia" },{ code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },{ code: "SS", name: "South Sudan" },{ code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },{ code: "SD", name: "Sudan" },{ code: "SR", name: "Suriname" },
  { code: "SE", name: "Sweden" },{ code: "CH", name: "Switzerland" },{ code: "SY", name: "Syria" },
  { code: "TW", name: "Taiwan" },{ code: "TJ", name: "Tajikistan" },{ code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },{ code: "TG", name: "Togo" },{ code: "TT", name: "Trinidad & Tobago" },
  { code: "TN", name: "Tunisia" },{ code: "TR", name: "Turkey" },{ code: "TM", name: "Turkmenistan" },
  { code: "UG", name: "Uganda" },{ code: "UA", name: "Ukraine" },{ code: "AE", name: "UAE" },
  { code: "GB", name: "United Kingdom" },{ code: "US", name: "United States" },{ code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },{ code: "VE", name: "Venezuela" },{ code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },{ code: "ZM", name: "Zambia" },{ code: "ZW", name: "Zimbabwe" },
];

const LANGUAGES = [
  { code: "FR", name: "Français", countryCode: "fr" },
  { code: "EN", name: "English", countryCode: "gb" },
  { code: "ES", name: "Español", countryCode: "es" },
  { code: "TR", name: "Türkçe", countryCode: "tr" },
];

const TZ_COUNTRY_MAP: Record<string, string> = {
  "Europe/Paris": "FR",
  "Europe/Brussels": "BE",
  "Europe/Zurich": "CH",
  "America/Toronto": "CA",
  "Africa/Casablanca": "MA",
  "Africa/Algiers": "DZ",
  "Africa/Tunis": "TN",
  "Africa/Abidjan": "CI",
  "Africa/Dakar": "SN",
  "Africa/Douala": "CM",
  "Europe/Istanbul": "TR",
  "Europe/Madrid": "ES",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Los_Angeles": "US",
  "Europe/London": "GB",
  "Europe/Berlin": "DE",
  "Europe/Rome": "IT",
  "Europe/Lisbon": "PT",
  "Europe/Amsterdam": "NL",
  "Africa/Brazzaville": "CG",
  "Africa/Kinshasa": "CD",
  "Africa/Libreville": "GA",
  "Africa/Bamako": "ML",
  "Africa/Ouagadougou": "BF",
  "Africa/Conakry": "GN",
  "Africa/Porto-Novo": "BJ",
  "Africa/Lome": "TG",
  "Indian/Antananarivo": "MG",
  "America/Mexico_City": "MX",
  "America/Bogota": "CO",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Sao_Paulo": "BR",
};

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("EN");
  const [countryOpen, setCountryOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  useEffect(() => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const locale = navigator.language || "fr-FR";
      const regionCode = locale.split("-")[1]?.toUpperCase() || "";
      const detected = TZ_COUNTRY_MAP[timezone] || regionCode;
      if (detected && COUNTRIES.some((c) => c.code === detected)) {
        setCountry(detected);
      }
    } catch {
      // Ignore
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      country: formData.get("country") as string,
      language: formData.get("language") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
      promoCode: formData.get("promoCode") as string,
    };

    if (data.password !== data.confirmPassword) {
      setError(t("passwordMismatch"));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || t("error"));
        setLoading(false);
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch {
      setError(t("error"));
      setLoading(false);
    }
  }

  const labelClass = "block text-left text-xs font-medium text-white/60 mb-2 uppercase tracking-wider";

  return (
    <div className="text-center">
      <h1 className="mb-2 text-3xl font-bold text-white">{t("title")}</h1>
      <p className="mb-8 text-sm text-white/50">{t("subtitle")}</p>

      {error && (
        <div className="mb-5 rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form method="POST" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div>
            <label htmlFor="lastName" className={labelClass}>{t("lastName")}</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
              </svg>
              <input id="lastName" name="lastName" type="text" placeholder="Dupont" required className="input-glass" />
            </div>
          </div>
          <div>
            <label htmlFor="firstName" className={labelClass}>{t("firstName")}</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
              </svg>
              <input id="firstName" name="firstName" type="text" placeholder="Jean" required className="input-glass" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div>
            <label htmlFor="email" className={labelClass}>{t("email")}</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <input id="email" name="email" type="email" placeholder="jean@exemple.com" required className="input-glass" />
            </div>
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>{t("phone")}</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <input id="phone" name="phone" type="tel" placeholder="+33 6 12 34 56 78" required className="input-glass" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {/* Country dropdown */}
          <div className="relative">
            <label className={labelClass}>{t("country")}</label>
            <input type="hidden" name="country" value={country} />
            <button type="button" onClick={() => { setCountryOpen(!countryOpen); setLangOpen(false); }} className="input-glass input-glass-noicon w-full text-left flex items-center gap-2.5">
              {country ? (
                <>
                  <FlagImg code={country} size={18} />
                  <span>{COUNTRIES.find((c) => c.code === country)?.name}</span>
                </>
              ) : (
                <span className="text-white/20">{t("selectCountry")}</span>
              )}
              <svg className={`ml-auto h-4 w-4 text-white/30 transition-transform ${countryOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
            {countryOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl max-h-52 overflow-hidden">
                <div className="p-2">
                  <input type="text" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} placeholder="Search..." autoFocus className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20 focus:border-primary" />
                </div>
                <div className="overflow-y-auto max-h-40">
                  {COUNTRIES.filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase())).map((c) => (
                    <button key={c.code} type="button" onClick={() => { setCountry(c.code); setCountryOpen(false); setCountrySearch(""); }} className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${country === c.code ? "bg-primary/10 text-primary" : "text-white/70"}`}>
                      <FlagImg code={c.code} size={18} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Language dropdown */}
          <div className="relative">
            <label className={labelClass}>{t("language")}</label>
            <input type="hidden" name="language" value={language} />
            <button type="button" onClick={() => { setLangOpen(!langOpen); setCountryOpen(false); }} className="input-glass input-glass-noicon w-full text-left flex items-center gap-2.5">
              <FlagImg code={LANGUAGES.find((l) => l.code === language)?.countryCode || "gb"} size={18} />
              <span>{LANGUAGES.find((l) => l.code === language)?.name}</span>
              <svg className={`ml-auto h-4 w-4 text-white/30 transition-transform ${langOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
            {langOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl overflow-hidden">
                {LANGUAGES.map((l) => (
                  <button key={l.code} type="button" onClick={() => { setLanguage(l.code); setLangOpen(false); }} className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${language === l.code ? "bg-primary/10 text-primary" : "text-white/70"}`}>
                    <FlagImg code={l.countryCode} size={18} />
                    {l.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div>
            <label htmlFor="password" className={labelClass}>{t("password")}</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <input id="password" name="password" type="password" placeholder={t("passwordPlaceholder")} required minLength={8} className="input-glass" />
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className={labelClass}>{t("confirm")}</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <input id="confirmPassword" name="confirmPassword" type="password" placeholder={t("confirmPlaceholder")} required minLength={8} className="input-glass" />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="promoCode" className={labelClass}>
            {t("promoCode")} <span className="text-white/30 font-normal normal-case">{t("promoCodeOptional")}</span>
          </label>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
            <input id="promoCode" name="promoCode" type="text" defaultValue={refCode} readOnly={!!refCode} placeholder={t("promoCodePlaceholder")} className={`input-glass ${refCode ? "text-primary font-semibold cursor-not-allowed" : ""}`} />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-glow w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover disabled:opacity-50">
          {loading ? t("submitting") : t("submit")}
        </button>
      </form>

      <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <p className="mt-6 text-sm text-white/40">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-primary hover:text-primary-hover transition-colors">
          {t("loginLink")}
        </Link>
      </p>
    </div>
  );
}
