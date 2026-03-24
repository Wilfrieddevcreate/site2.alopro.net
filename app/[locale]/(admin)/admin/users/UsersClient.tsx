"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { confirmDelete, showSuccess, showError } from "@/app/lib/swal";

const PAGE_SIZE = 20;

interface UserData {
  id: string; firstName: string; lastName: string; email: string; phone: string;
  country: string; emailVerified: boolean; trialEndsAt: string | null; createdAt: string;
  hasSubscription: boolean; subscriptionType: string | null; affiliateStatus: string | null;
  affiliatePromoCode: string | null; referredBy: string | null;
}

export default function UsersClient() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [trialDays, setTrialDays] = useState<Record<string, string>>({});
  const pageRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async (page: number, searchQuery: string, append: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ skip: String(page * PAGE_SIZE), take: String(PAGE_SIZE) });
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      const items: UserData[] = data.items || [];
      setTotal(data.total || 0);

      if (append) {
        setUsers((prev) => [...prev, ...items]);
      } else {
        setUsers(items);
      }
      setHasMore(items.length === PAGE_SIZE);
    } catch {
      toast.error("Failed to load users");
    }
    setLoading(false);
  }, []);

  // Initial load + search change
  useEffect(() => {
    pageRef.current = 0;
    fetchUsers(0, searchDebounced, false);
  }, [searchDebounced, fetchUsers]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          pageRef.current += 1;
          fetchUsers(pageRef.current, searchDebounced, true);
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);

    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, searchDebounced, fetchUsers]);

  function getStatus(u: UserData) {
    if (u.hasSubscription) return { label: u.subscriptionType || "Active", color: "emerald" };
    const trialActive = u.trialEndsAt ? new Date(u.trialEndsAt) > new Date() : false;
    if (trialActive) return { label: "Trial", color: "amber" };
    if (!u.emailVerified) return { label: "Unverified", color: "red" };
    return { label: "Expired", color: "gray" };
  }

  async function handleDelete(userId: string, name: string) {
    const confirmed = await confirmDelete(`the account of ${name}`);
    if (!confirmed) return;
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      showSuccess("Deleted", `${name}'s account has been removed.`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setTotal((prev) => prev - 1);
    } else {
      const data = await res.json();
      showError("Error", data.error || "Failed to delete user");
    }
  }

  async function handleExtendTrial(userId: string, days: number) {
    const res = await fetch("/api/admin/users/extend-trial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, days }),
    });
    if (res.ok) {
      toast.success(days >= 0 ? `Trial extended by ${days} days` : `Trial reduced by ${Math.abs(days)} days`);
      // Refresh just this user
      pageRef.current = 0;
      fetchUsers(0, searchDebounced, false);
    } else {
      toast.error("Failed to update trial");
    }
  }

  async function handleAddUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: fd.get("firstName"), lastName: fd.get("lastName"),
        email: fd.get("email"), phone: fd.get("phone") || "",
        country: fd.get("country") || "US", language: "EN",
        password: fd.get("password"),
        trialDays: parseInt(fd.get("trialDays") as string) || 0,
      }),
    });
    setAddLoading(false);
    if (res.ok) {
      showSuccess("User created", "The new account has been created and verified.");
      setShowAddForm(false);
      pageRef.current = 0;
      fetchUsers(0, searchDebounced, false);
    } else {
      const data = await res.json();
      showError("Error", data.error || "Failed to create user");
    }
  }

  const inputClass = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-primary placeholder:text-white/20";
  const badgeColor = (c: string) =>
    c === "emerald" ? "bg-emerald-500/10 text-emerald-400" :
    c === "amber" ? "bg-amber-500/10 text-amber-400" :
    c === "red" ? "bg-red-500/10 text-red-400" :
    "bg-white/5 text-white/30";

  return (
    <div className="pt-8 lg:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Users <span className="text-white/30 text-lg">({total})</span></h1>
        <div className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full sm:w-64 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-primary"
          />
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-glow shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            {showAddForm ? "Cancel" : "+ Add User"}
          </button>
        </div>
      </div>

      {/* Add user form */}
      {showAddForm && (
        <form onSubmit={handleAddUser} className="card-dark p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">Create new user</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-4">
            <div>
              <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">Last name *</label>
              <input name="lastName" required placeholder="Doe" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">First name *</label>
              <input name="firstName" required placeholder="John" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">Email *</label>
              <input name="email" type="email" required placeholder="john@example.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">Phone</label>
              <input name="phone" placeholder="+33..." className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">Password *</label>
              <input name="password" type="password" required minLength={8} placeholder="Min 8 characters" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">Trial days</label>
              <input name="trialDays" type="number" defaultValue="7" min="0" max="365" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">Country</label>
              <input name="country" defaultValue="US" className={inputClass} />
            </div>
          </div>
          <button type="submit" disabled={addLoading} className="btn-glow rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50">
            {addLoading ? "Creating..." : "Create user"}
          </button>
        </form>
      )}

      {/* Users list */}
      <div className="space-y-3">
        {users.map((u) => {
          const status = getStatus(u);
          const isExpanded = expandedUser === u.id;
          const daysVal = trialDays[u.id] || "7";

          return (
            <div key={u.id} className="card-dark overflow-hidden">
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpandedUser(isExpanded ? null : u.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{u.firstName} {u.lastName}</div>
                    <div className="text-xs text-white/30 truncate">{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${badgeColor(status.color)}`}>
                    {status.label}
                  </span>
                  <svg className={`h-4 w-4 text-white/20 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-white/5 p-5 space-y-5">
                  <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                    <div>
                      <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-1">Phone</div>
                      <div className="text-sm text-white/60">{u.phone || "—"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-1">Country</div>
                      <div className="text-sm text-white/60 flex items-center gap-1.5">
                        <img src={`https://flagcdn.com/w20/${u.country.toLowerCase()}.png`} alt={u.country} className="w-5 h-3.5 rounded-sm object-cover" />
                        {u.country}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-1">Joined</div>
                      <div className="text-sm text-white/60">{new Date(u.createdAt).toLocaleDateString("en-GB")}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-1">Trial ends</div>
                      <div className="text-sm text-white/60">{u.trialEndsAt ? new Date(u.trialEndsAt).toLocaleDateString("en-GB") : "—"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-1">Email verified</div>
                      <div className="text-sm">{u.emailVerified ? <span className="text-emerald-400">Yes</span> : <span className="text-red-400">No</span>}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-1">Affiliation</div>
                      <div className="text-sm">
                        {u.affiliateStatus === "APPROVED" ? (
                          <span className="text-emerald-400">Approved {u.affiliatePromoCode && <span className="text-white/30 ml-1">({u.affiliatePromoCode})</span>}</span>
                        ) : u.affiliateStatus === "PENDING" ? (
                          <span className="text-amber-400">Pending</span>
                        ) : u.affiliateStatus === "REJECTED" ? (
                          <span className="text-red-400">Rejected</span>
                        ) : (
                          <span className="text-white/30">None</span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-1">Referred by</div>
                      <div className="text-sm text-white/60">{u.referredBy || "—"}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExtendTrial(u.id, -(parseInt(daysVal) || 7))}
                        className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
                      >−</button>
                      <input
                        type="number" value={daysVal}
                        onChange={(e) => setTrialDays({ ...trialDays, [u.id]: e.target.value })}
                        min="1" max="365"
                        className="w-16 rounded-lg bg-white/5 border border-white/10 px-2 py-2 text-xs text-white text-center outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => handleExtendTrial(u.id, parseInt(daysVal) || 7)}
                        className="rounded-lg bg-primary/15 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/25 transition-colors"
                      >+</button>
                      <span className="text-xs text-white/20 ml-1">days trial</span>
                    </div>
                    <div className="flex-1" />
                    <button
                      onClick={() => handleDelete(u.id, `${u.firstName} ${u.lastName}`)}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                    >Delete account</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sentinel for infinite scroll */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {loading && (
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}

      {!hasMore && users.length > 0 && (
        <p className="text-center text-xs text-white/20 py-4">All users loaded</p>
      )}

      {!loading && users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <svg className="h-7 w-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <p className="text-sm text-white/30">{search ? "No users match your search." : "No users yet."}</p>
        </div>
      )}
    </div>
  );
}
