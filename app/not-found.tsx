import Image from "next/image";
import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/assets/images/auth-bg.jpg.jpeg"
          alt=""
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Logo */}
        <Image
          src="/assets/images/logo_kodex.png"
          alt="Kodex"
          width={140}
          height={50}
          className="mb-10 h-10 w-auto"
        />

        {/* 404 number */}
        <h1 className="text-[120px] sm:text-[160px] font-extrabold leading-none text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-white/5 select-none">
          404
        </h1>

        {/* Message */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-3">
          Page not found
        </h2>
        <p className="text-sm sm:text-base text-white/40 max-w-md mb-8 leading-relaxed">
          The page you are looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/en"
            className="btn-glow rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover"
          >
            Go to homepage
          </Link>
          <Link
            href="/en/dashboard"
            className="rounded-xl border border-white/10 px-8 py-3.5 text-sm font-medium text-white/50 transition-all hover:bg-white/5 hover:text-white/80"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
