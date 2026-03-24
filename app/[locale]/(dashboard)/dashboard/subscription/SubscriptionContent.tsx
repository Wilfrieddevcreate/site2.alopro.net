"use client";

import { useEffect, useState } from "react";
import { Link } from "@/app/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/app/i18n/navigation";

interface SubData {
  id: string;
  type: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
}

interface HistoryData extends SubData {
  cancelledAt: string | null;
}

interface Props {
  activeSub: SubData | null;
  hasStripeCustomer: boolean;
  trialEndsAt: string | null;
  hasTelegram: boolean;
  history: HistoryData[];
}

export default function SubscriptionContent({ activeSub, hasStripeCustomer, trialEndsAt, hasTelegram, history }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isSuccess = searchParams.get("success");
  const sessionId = searchParams.get("session_id");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  // On success redirect, verify the session to ensure subscription is created
  useEffect(() => {
    if (isSuccess && sessionId && !activeSub && !verifying && !verified) {
      setVerifying(true);
      fetch("/api/stripe/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json())
        .then((data) => {
          setVerifying(false);
          setVerified(true);
          if (data.status === "created" || data.status === "already_processed") {
            // Full page reload to refresh layout (access banner, sidebar, etc.)
            window.location.href = window.location.pathname;
          }
        })
        .catch(() => {
          setVerifying(false);
        });
    }
  }, [isSuccess, sessionId, activeSub, verifying, verified, router]);

  async function handlePortal() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <div className="pt-8 lg:pt-0">
      <h1 className="text-2xl font-bold text-white mb-6">Subscription</h1>

      {/* Verifying payment */}
      {verifying && (
        <div className="mb-6 rounded-xl bg-primary/10 border border-primary/20 px-5 py-4 flex items-center gap-3">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-primary font-medium">Verifying your payment...</span>
        </div>
      )}

      {/* Success message */}
      {(isSuccess && (activeSub || verified)) && !verifying && (
        <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-5 py-4">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-emerald-400">Payment successful!</p>
              <p className="text-xs text-emerald-400/60">Your subscription is now active. You can download your invoice from the Invoices page.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {activeSub?.type === "MANAGED" && (
              <Link href="/dashboard/managed" className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-colors">
                Setup your exchange account →
              </Link>
            )}
          </div>

          {/* Telegram connect prompt */}
          {!hasTelegram && (
            <div className="mt-4 rounded-xl bg-[#2AABEE]/10 border border-[#2AABEE]/20 px-4 py-3 flex items-center gap-3 flex-wrap">
              <svg className="h-5 w-5 text-[#2AABEE] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#2AABEE]">Connect your Telegram</p>
                <p className="text-xs text-[#2AABEE]/60">Receive trading signals and news instantly via Telegram.</p>
              </div>
              <Link href="/dashboard/settings" className="rounded-lg bg-[#2AABEE] px-4 py-2 text-xs font-semibold text-white hover:bg-[#229ED9] transition-colors shrink-0">
                Connect now
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Active subscription */}
      {activeSub ? (
        <div className="card-dark p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-bold text-white">
                  {activeSub.type === "MANAGED" ? "Managed Trading" : "Signals"}
                </span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase">
                  {activeSub.status}
                </span>
              </div>
              <p className="text-sm text-white/40">
                Started {new Date(activeSub.currentPeriodStart).toLocaleDateString("en-GB")}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/30 uppercase tracking-wider">Expires</div>
              <div className="text-base font-semibold text-white">
                {new Date(activeSub.currentPeriodEnd).toLocaleDateString("en-GB")}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-dark p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-lg font-bold text-white mb-1">No active subscription</div>
              {trialEndsAt && new Date(trialEndsAt) > new Date() ? (
                <p className="text-sm text-amber-400">
                  Free trial until {new Date(trialEndsAt).toLocaleDateString("en-GB")}
                </p>
              ) : (
                <p className="text-sm text-white/40">Subscribe to access all features</p>
              )}
            </div>
            <Link
              href="/subscribe"
              className="btn-glow rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-hover text-center"
            >
              Subscribe now
            </Link>
          </div>
        </div>
      )}

      {/* Actions */}
      {activeSub && (
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Link
            href="/subscribe"
            className="btn-glow rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-hover text-center"
          >
            Upgrade / Renew
          </Link>
          <Link
            href="/dashboard/invoices"
            className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-white/40 transition-all hover:bg-white/5 hover:text-white/70 text-center"
          >
            View invoices
          </Link>
          {hasStripeCustomer && (
            <button
              onClick={handlePortal}
              className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-white/40 transition-all hover:bg-white/5 hover:text-white/70"
            >
              Stripe Portal
            </button>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="card-dark overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Subscription history</h2>
          </div>
          <div className="divide-y divide-white/5">
            {history.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="text-sm font-medium text-white">
                    {sub.type === "MANAGED" ? "Managed Trading" : "Signals"}
                  </div>
                  <div className="text-xs text-white/25">
                    {new Date(sub.currentPeriodStart).toLocaleDateString("en-GB")} — {new Date(sub.currentPeriodEnd).toLocaleDateString("en-GB")}
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                  sub.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400" :
                  sub.status === "CANCELLED" ? "bg-red-500/10 text-red-400" :
                  sub.status === "PAST_DUE" ? "bg-amber-500/10 text-amber-400" :
                  "bg-white/5 text-white/30"
                }`}>{sub.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
