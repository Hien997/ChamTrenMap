import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [tourTotal, tourPublished, checkpointTotal, checkpointsWithGuides, guideTotal] =
    await Promise.all([
      prisma.tour.count(),
      prisma.tour.count({ where: { status: "PUBLISHED" } }),
      prisma.checkpoint.count(),
      prisma.checkpoint.count({ where: { guides: { some: {} } } }),
      prisma.guideSection.count(),
    ]);

  const tourDrafts = tourTotal - tourPublished;

  const rows = [
    {
      href: "/admin/tours",
      title: "Tours",
      desc:
        tourTotal === 0
          ? "Create the first tour to get started."
          : `${tourPublished} published, ${tourDrafts} ${tourDrafts === 1 ? "draft" : "drafts"}.`,
      count: tourTotal,
    },
    {
      href: "/admin/checkpoints",
      title: "Checkpoints",
      desc:
        checkpointTotal === 0
          ? "Add the first checkpoint on the map."
          : `${checkpointsWithGuides} of ${checkpointTotal} have guide content.`,
      count: checkpointTotal,
    },
  ];

  return (
    <div>
      <PageHeader title="Overview" />

      <div className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
        {rows.map(({ href, title, desc, count }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 px-5 py-5 transition-colors duration-200 hover:bg-accent/40"
          >
            <div className="min-w-0 flex-1">
              <h2 className="font-medium">{title}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
            </div>
            <span className="text-2xl font-medium tabular-nums">{count}</span>
            <ArrowRightIcon
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        ))}

        <div className="flex items-center gap-4 px-5 py-5">
          <div className="min-w-0 flex-1">
            <h2 className="font-medium">Guide sections</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Written across all checkpoints, in Vietnamese and English.
            </p>
          </div>
          <span className="text-2xl font-medium tabular-nums">{guideTotal}</span>
        </div>
      </div>
    </div>
  );
}
