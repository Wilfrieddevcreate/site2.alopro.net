import { prisma } from "@/app/lib/prisma";

export default async function AdminDashboard() {
  const [usersCount, activeSubsCount, callsCount, newsCount, pendingAffiliations] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.call.count({ where: { active: true } }),
    prisma.news.count({ where: { active: true } }),
    prisma.affiliate.count({ where: { status: "PENDING" } }),
  ]);

  const recentUsers = await prisma.user.findMany({
    where: { role: "CLIENT" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, firstName: true, lastName: true, email: true, emailVerified: true, createdAt: true, trialEndsAt: true },
  });

  const stats = [
    { label: "Total Users", value: usersCount, icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z", color: "text-primary" },
    { label: "Active Subscriptions", value: activeSubsCount, icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z", color: "text-emerald-400" },
    { label: "Active Calls", value: callsCount, icon: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22", color: "text-amber-400" },
    { label: "Published News", value: newsCount, icon: "M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25", color: "text-violet-400" },
    { label: "Pending Affiliations", value: pendingAffiliations, icon: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244", color: pendingAffiliations > 0 ? "text-red-400" : "text-white/30" },
  ];

  return (
    <div className="pt-8 lg:pt-0">
      <h1 className="text-2xl font-bold text-white mb-8">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-10">
        {stats.map((stat) => (
          <div key={stat.label} className="card-dark p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5`}>
                <svg className={`h-5 w-5 ${stat.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-white/30 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent users */}
      <div className="card-dark overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recent Users</h2>
          <a href="/admin/users" className="text-xs text-primary hover:text-primary-hover transition-colors">View all</a>
        </div>
        <div className="divide-y divide-white/5">
          {recentUsers.map((u) => {
            const now = new Date();
            const isTrialActive = u.trialEndsAt ? u.trialEndsAt > now : false;
            return (
              <div key={u.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{u.firstName} {u.lastName}</div>
                    <div className="text-xs text-white/25">{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!u.emailVerified && (
                    <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-red-400">Unverified</span>
                  )}
                  {u.emailVerified && isTrialActive && (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">Trial</span>
                  )}
                  <span className="text-xs text-white/20">{u.createdAt.toLocaleDateString("en-GB")}</span>
                </div>
              </div>
            );
          })}
          {recentUsers.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-white/30">No users yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
