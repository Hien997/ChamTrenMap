"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { buttonVariants , Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, StatusChip } from "@/components/admin/ui";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";

type TPaginatedTour = {
  id: string;
  slug: string;
  status: string;
  vi: { name: string } | null;
  en: { name: string } | null;
  checkpointCount: number;
};

function fetchTours(): Promise<TPaginatedTour[]> {
  return fetch("/api/admin/tours", { cache: "no-store" })
    .then((res) => res.json())
    .then((json) => {
      if (!json.ok) throw new Error(json.error || "Failed to load tours");
      return json.tours as TPaginatedTour[];
    });
}

export default function AdminToursListPage() {
  const [tours, setTours] = useState<TPaginatedTour[] | null>(null);
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    fetchTours()
      .then((data) => {
        if (!cancelled) setTours(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ slug: string; name: string } | null>(null);

  const retry = () => {
    setError(false);
    fetchTours()
      .then(setTours)
      .catch(() => setError(true));
  };

  const onDelete = useCallback(
    (slug: string, name: string) => {
      setConfirmTarget({ slug, name });
      setConfirmOpen(true);
    },
    []
  );

  const confirmDelete = useCallback(() => {
    const target = confirmTarget;
    setConfirmOpen(false);
    if (!target) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/tours/${target.slug}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        setTours((prev) => prev?.filter((t) => t.slug !== target.slug) ?? null);
      }
    });
  }, [confirmTarget, setConfirmOpen, setTours]);

  return (
    <div>
      <PageHeader
        title="Tours"
        actions={
          <Link
            href="/admin/tours/new"
            className={buttonVariants({ size: "sm" })}
          >
            <PlusIcon aria-hidden className="size-4" />
            New tour
          </Link>
        }
      />

      {error ? (
        <div className="rounded-lg border bg-card px-6 py-12 text-center">
          <p className="font-medium">Couldn&apos;t load tours</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check the connection, then try again.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={retry}>
            Retry
          </Button>
        </div>
      ) : tours === null ? (
        <div className="space-y-2" aria-hidden>
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      ) : tours.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card/50 px-6 py-12 text-center">
          <p className="font-medium">No tours yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create the first tour, then add its checkpoints.
          </p>
          <Link
            href="/admin/tours/new"
            className={buttonVariants({ size: "sm", className: "mt-4" })}
          >
            <PlusIcon aria-hidden className="size-4" />
            New tour
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
          {tours.map((tour) => {
            const name = tour.vi?.name || tour.slug;
            return (
              <li
                key={tour.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4"
              >
                <div className="min-w-0 flex-1 basis-56">
                  <div className="flex items-center gap-2.5">
                    <h3 className="truncate font-medium">{name}</h3>
                    <StatusChip status={tour.status} />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {tour.en?.name || tour.slug}
                  </p>
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {tour.checkpointCount}{" "}
                  {tour.checkpointCount === 1 ? "stop" : "stops"}
                </span>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/tours/${tour.slug}`}
                    aria-label={`Edit ${name}`}
                    className={buttonVariants({ variant: "ghost", size: "icon" })}
                  >
                    <PencilIcon aria-hidden className="size-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDelete(tour.slug, name)}
                    disabled={isPending}
                    aria-label={`Delete ${name}`}
                    className={buttonVariants({ variant: "ghost", size: "icon" })}
                  >
                    <TrashIcon aria-hidden className="size-4 text-destructive" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDelete
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmTarget?.name ?? ""}
        onConfirm={confirmDelete}
        pending={isPending}
      />
    </div>
  );
}