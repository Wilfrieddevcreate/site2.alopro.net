"use client";

// Maps language codes to country codes for flag-icons
const LANG_TO_COUNTRY: Record<string, string> = {
  FR: "fr", EN: "gb", ES: "es", TR: "tr",
  DE: "de", IT: "it", PT: "pt", NL: "nl",
  AR: "sa", ZH: "cn", JA: "jp", KO: "kr",
  RU: "ru", HI: "in", PL: "pl", SV: "se",
  DA: "dk", NO: "no", FI: "fi", EL: "gr",
  CS: "cz", RO: "ro", HU: "hu", UK: "ua",
  TH: "th", VI: "vn", ID: "id", MS: "my",
  SW: "ke", HE: "il",
};

// Maps country codes directly
const COUNTRY_MAP: Record<string, string> = {
  FR: "fr", BE: "be", CH: "ch", CA: "ca", MA: "ma", DZ: "dz", TN: "tn",
  CI: "ci", SN: "sn", CM: "cm", TR: "tr", ES: "es", US: "us", GB: "gb",
  DE: "de", IT: "it", PT: "pt", NL: "nl", CG: "cg", CD: "cd", GA: "ga",
  ML: "ml", BF: "bf", GN: "gn", BJ: "bj", TG: "tg", MG: "mg", MX: "mx",
  CO: "co", AR: "ar", BR: "br",
};

interface FlagIconProps {
  code: string;
  type?: "language" | "country";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function FlagIcon({ code, type = "country", size = "md", className = "" }: FlagIconProps) {
  const countryCode = type === "language"
    ? LANG_TO_COUNTRY[code.toUpperCase()] || code.toLowerCase()
    : COUNTRY_MAP[code.toUpperCase()] || code.toLowerCase();

  const sizeClass = size === "sm" ? "w-4 h-3" : size === "lg" ? "w-8 h-6" : "w-5 h-4";

  return (
    <span
      className={`fi fi-${countryCode} inline-block rounded-sm ${sizeClass} ${className}`}
      style={{ backgroundSize: "cover" }}
    />
  );
}
