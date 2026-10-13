import Link from "next/link";
import {
  ActivityIcon,
  ArrowUpRightIcon,
  FootprintsIcon,
  MapIcon,
  MapPinIcon,
} from "lucide-react";
import { getAdminDashboard } from "@/services/admin-dashboard.service";
import { PageHeader, Panel } from "@/components/admin/ui";
import { StatCard } from "@/components/admin/StatCard";
import { CheckInsTrend } from "@/components/admin/CheckInsTrend";
import { Progress } from "@/components/ui/progress";
import { formatRelativeTime } from "@/lib/relative-time";

export const dynamic = "force-dynamic";

const plural = (count: number, word: string): string =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

const AdminDashboard = async () => {
  const dashboard = await getAdminDashboard();
  const {
    toursTotal,
    toursPublished,
    toursDrafts,
    checkpointsTotal,
    checkpointsWithGuides,
    guideSections,
    checkInsTotal,
    checkInsLast7Days,
    distinctVisitors,
  } = dashboard.counts;

  return (
    <div>
      <PageHeader
        title="Overview"
        sub={`Last updated ${new Date(dashboard.generatedAt).toLocaleString("en-GB")}`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Tours"
          value={toursTotal}
          hint={`${toursPublished} published · ${toursDrafts} drafts`}
          icon={MapIcon}
          href="/admin/tours"
        />
        <StatCard
          label="Checkpoints"
          value={checkpointsTotal}
          hint={`${checkpointsWithGuides} with guide content`}
          icon={MapPinIcon}
          href="/admin/checkpoints"
        />
        <StatCard
          label="Check-ins"
          value={checkInsTotal}
          hint={`${plural(checkInsLast7Days, "this week")}`}
          icon={FootprintsIcon}
        />
        <StatCard
          label="Visitors"
          value={distinctVisitors}
          hint="Distinct people who checked in"
          icon={ActivityIcon}
        />
      </div>

      <div className="mt-6">
        <Panel
          title="Check-ins trend"
          action={
            <span className="text-xs text-muted-foreground">
              last {dashboard.checkInsTrend.length} days
            </span>
          }
        >
          <CheckInsTrend buckets={dashboard.checkInsTrend} />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Per-tour progress">
          {dashboard.tourProgress.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              <p>No published tours yet.</p>
              <Link
                href="/admin/tours/new"
                className="mt-2 inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                Create the first tour
              </Link>{" "}
              <span>then add its checkpoints.</span>
            </div>
          ) : (
            <ul className="space-y-5">
              {dashboard.tourProgress.map((tour) => (
                <li key={tour.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <Link
                      href={`/admin/tours/${tour.slug}`}
                      className="truncate font-medium underline-offset-4 hover:underline"
                    >
                      {tour.name}
                    </Link>
                    <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                      {tour.completedCount}/{tour.visitorCount} completed
                    </span>
                  </div>
                  <Progress value={tour.percent}>
                    <span className="sr-only">
                      {tour.percent}% of visitors completed {tour.name}
                    </span>
                  </Progress>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {plural(tour.checkpointCount, "stop")} ·{" "}
                    {plural(tour.visitorCount, "visitor")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent activity">
          {dashboard.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No check-ins yet. They will appear here as visitors arrive.
            </p>
          ) : (
            <div className="-mx-5 -my-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th scope="col" className="px-5 py-2 text-left font-medium">
                      Checkpoint
                    </th>
                    <th scope="col" className="px-5 py-2 text-left font-medium">
                      Visitor
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-2 text-right font-medium whitespace-nowrap"
                    >
                      Accuracy
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-2 text-right font-medium whitespace-nowrap"
                    >
                      When
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dashboard.recentActivity.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors duration-200 hover:bg-accent/40"
                    >
                      <td className="max-w-40 truncate px-5 py-2.5 font-medium">
                        <Link
                          href={`/admin/checkpoints/${row.checkpointSlug}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {row.checkpointName}
                        </Link>
                      </td>
                      <td className="max-w-32 truncate px-5 py-2.5 text-muted-foreground">
                        {row.visitor}
                      </td>
                      <td className="px-5 py-2.5 text-right text-muted-foreground tabular-nums whitespace-nowrap">
                        ±{Math.round(row.accuracy)} m
                      </td>
                      <td className="px-5 py-2.5 text-right text-muted-foreground tabular-nums whitespace-nowrap">
                        <time
                          dateTime={row.checkedInAt.toISOString()}
                          title={row.checkedInAt.toLocaleString("en-GB")}
                        >
                          {formatRelativeTime(row.checkedInAt)}
                        </time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {plural(guideSections, "guide section")} written across all checkpoints.
      </p>
    </div>
  );
};

export default AdminDashboard;
