"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if already installed
  useEffect(() => {
    // Standalone mode = already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed before (don't show again for 7 days)
    const dismissedAt = localStorage.getItem("pwa-install-dismissed");
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt)) / 86400000;
      if (daysSince < 7) {
        setDismissed(true);
        return;
      }
    }
  }, []);

  // Capture the beforeinstallprompt event
  const handleBeforeInstall = useCallback((e: Event) => {
    e.preventDefault();
    setDeferredPrompt(e as BeforeInstallPromptEvent);
    // Show prompt after a small delay (don't interrupt the user immediately)
    setTimeout(() => setShowPrompt(true), 2000);
  }, []);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Listen for app installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [handleBeforeInstall]);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  }

  // iOS detection (no beforeinstallprompt on Safari)
  const isIOS = typeof navigator !== "undefined" && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document));
  const isSafari = typeof navigator !== "undefined" && /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);
  const showIOSPrompt = isIOS && isSafari && !isInstalled && !dismissed;

  // Don't show if installed, dismissed, or no prompt available
  if (isInstalled || dismissed) return null;
  if (!showPrompt && !showIOSPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:w-[380px] z-50 animate-in slide-in-from-bottom-4">
      <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl shadow-black/50 p-5">
        {/* Close */}
        <button onClick={handleDismiss} className="absolute top-3 right-3 text-white/20 hover:text-white/50 transition-colors">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-start gap-4">
          <div className="shrink-0 h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
            <Image src="/assets/images/logo_kodex.png" alt="Kodex" width={40} height={40} className="object-contain" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white mb-0.5">Install Kodex</h3>
            <p className="text-xs text-white/40 leading-relaxed mb-3">
              {showIOSPrompt
                ? "Tap the share button, then \"Add to Home Screen\" to install Kodex."
                : "Install the app for a faster, native-like experience with push notifications."
              }
            </p>

            {showIOSPrompt ? (
              // iOS instructions
              <div className="flex items-center gap-2 text-xs text-white/30">
                <svg className="h-5 w-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" />
                </svg>
                <span>Tap <strong className="text-white/60">Share</strong> → <strong className="text-white/60">Add to Home Screen</strong></span>
              </div>
            ) : (
              // Chrome/Edge/Firefox install button
              <div className="flex gap-2">
                <button
                  onClick={handleInstall}
                  className="btn-glow rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition-all"
                >
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/40 hover:text-white/60 hover:bg-white/5 transition-all"
                >
                  Not now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
