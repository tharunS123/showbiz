import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  getEventCountsByType,
  getDailyActiveUsers,
  getRecClickThroughRate,
  getListDepthAverages,
  getTopRatedItems,
  getTotalActiveUsers,
  getSignupCohortRetention,
} from "@/lib/db/analytics";
import { MetricCard } from "@/components/admin/metric-card";
import { Chart } from "@/components/admin/chart";

export const metadata: Metadata = {
  title: "Admin Dashboard — Showbiz",
};

function isAdmin(email: string): boolean {
  const allowed = process.env.ADMIN_EMAILS ?? "";
  return allowed
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase());
}

export default async function AdminDashboardPage() {
  const user = await requireUser();
  if (!isAdmin(user.email)) redirect("/");

  const [eventCounts, dauTrend, ctr, listDepths, topRated, totalUsers, cohorts] =
    await Promise.all([
      getEventCountsByType(),
      getDailyActiveUsers(30),
      getRecClickThroughRate(),
      getListDepthAverages(),
      getTopRatedItems(10),
      getTotalActiveUsers(),
      getSignupCohortRetention(8),
    ]);

  const totalEvents = Object.values(eventCounts).reduce((s, c) => s + c, 0);
  const todayDAU = dauTrend.at(-1)?.count ?? 0;

  const eventChartData = Object.entries(eventCounts).map(([type, count]) => ({
    label: type.replace(/_/g, " "),
    value: count,
  }));

  const dauChartData = dauTrend.map((d) => ({
    label: d.date.slice(5),
    value: d.count,
  }));

  const cohortDay7Data = cohorts.map((row) => ({
    label: row.cohort,
    value: row.day7Retention,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Analytics overview for Showbiz
      </p>

      {/* Metric cards */}
      <section
        aria-label="Key metrics"
        className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <MetricCard
          label="Total Events"
          value={totalEvents.toLocaleString()}
          description="All-time interaction count"
        />
        <MetricCard
          label="DAU (Today)"
          value={todayDAU}
          description="Unique users today"
        />
        <MetricCard
          label="Rec CTR"
          value={`${(ctr * 100).toFixed(1)}%`}
          description="Rec clicks / impressions"
        />
        <MetricCard
          label="Active Users"
          value={totalUsers.toLocaleString()}
          description="Registered accounts"
        />
      </section>

      {/* Event counts bar chart */}
      <section aria-label="Event breakdown" className="mt-10">
        <h2 className="text-xl font-semibold">Event Breakdown</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Counts by event type
        </p>
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <Chart data={eventChartData} type="bar" />
        </div>
      </section>

      {/* DAU trend line chart */}
      <section aria-label="Daily active users trend" className="mt-10">
        <h2 className="text-xl font-semibold">Daily Active Users</h2>
        <p className="mt-1 text-sm text-muted-foreground">Last 30 days</p>
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <Chart data={dauChartData} type="line" />
        </div>
      </section>

      {/* List depth averages */}
      <section aria-label="List depth averages" className="mt-10">
        <h2 className="text-xl font-semibold">List Depth Averages</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Average items per user by list type
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(listDepths).map(([type, avg]) => (
            <MetricCard
              key={type}
              label={type.replace(/_/g, " ")}
              value={avg.toFixed(1)}
              description="avg items per user"
            />
          ))}
          {Object.keys(listDepths).length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full">
              No list data yet.
            </p>
          )}
        </div>
      </section>

      {/* Cohort retention */}
      <section aria-label="Signup cohort retention" className="mt-10">
        <h2 className="text-xl font-semibold">Signup Cohort Retention</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Day-7 retention by signup month cohort
        </p>
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <Chart data={cohortDay7Data} type="line" />
        </div>
      </section>

      {/* Top rated items table */}
      <section aria-label="Top rated items" className="mt-10 mb-12">
        <h2 className="text-xl font-semibold">Top Rated Items</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Highest average user ratings
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Title
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Avg Rating
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Ratings
                </th>
              </tr>
            </thead>
            <tbody>
              {topRated.map((item, i) => (
                <tr
                  key={i}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                      {item.media_type === "movie" ? "Movie" : "TV"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {item.avg_rating.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {item.rating_count}
                  </td>
                </tr>
              ))}
              {topRated.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    No rated items yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
