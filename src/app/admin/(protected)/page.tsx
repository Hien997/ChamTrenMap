import Link from "next/link";
import {
  ActivityIcon,
  FootprintsIcon,
  MapIcon,
  MapPinIcon,
} from "lucide-react";
import { getAdminDashboard } from "@/services/admin-dashboard.service";
import { PageHeader, Panel } from "@/components/admin/ui";
import { StatCard } from "@/components/admin/StatCard";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

const plural = (count: number, word: string): string =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

const timeOf = (date: Date): string =>
  date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Per-tour progress">
          {dashboard.tourProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No published tours yet. Create one, then add its checkpoints.
            </p>
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
            <ul className="divide-y divide-border">
              {dashboard.recentActivity.map((row) => (
                <li key={row.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-medium">
                      {row.checkpointName}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeOf(row.checkedInAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {row.visitor} · ±{Math.round(row.accuracy)} m ·{" "}
                    {Math.round(row.distanceFromCheckpoint)} m from stop
                  </p>
                </li>
              ))}
            </ul>
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
