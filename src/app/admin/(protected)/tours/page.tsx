"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { PencilIcon, PlusIcon, SearchIcon, TrashIcon } from "lucide-react";
import { buttonVariants , Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, StatusChip } from "@/components/admin/ui";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { usePaginatedAdminList } from "@/hooks/usePaginatedAdminList";

type TPaginatedTour = {
  id: string;
  slug: string;
  status: string;
  vi: { name: string } | null;
  en: { name: string } | null;
  checkpointCount: number;
};

export default function AdminToursListPage() {
  const {
    items: tours,
    total,
    search,
    setSearch,
    appliedQuery,
    clearSearch,
    error,
    retry,
    hasMore,
    loadMore,
    loadingMore,
    moreError,
    removeItem,
    sentinelRef,
  } = usePaginatedAdminList<TPaginatedTour>("/api/admin/tours");

  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    id: string;
    slug: string;
    name: string;
  } | null>(null);

  const onDelete = useCallback((id: string, slug: string, name: string) => {
    setConfirmTarget({ id, slug, name });
    setConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    const target = confirmTarget;
    setConfirmOpen(false);
    if (!target) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/tours/${target.slug}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) removeItem(target.id);
    });
  }, [confirmTarget, removeItem]);

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

      <div className="relative mb-4">
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tours by name or slug…"
          aria-label="Search tours"
          className="pl-8"
        />
      </div>

      {tours !== null && total > 0 && (
        <p className="mb-2 text-sm text-muted-foreground">
          Showing {tours.length} of {total}{" "}
          {total === 1 ? "tour" : "tours"}
          {appliedQuery !== "" ? ` for “${appliedQuery}”` : ""}
        </p>
      )}

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
      ) : tours.length === 0 && appliedQuery !== "" ? (
        <div className="rounded-lg border border-dashed bg-card/50 px-6 py-12 text-center">
          <p className="font-medium">No tours match “{appliedQuery}”</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different name or slug.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={clearSearch}
          >
            Clear search
          </Button>
        </div>
      ) : total === 0 ? (
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
                    onClick={() => onDelete(tour.id, tour.slug, name)}
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

      {tours !== null && hasMore && (
        <div className="py-6 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading…" : moreError ? "Try again" : "Load more"}
          </Button>
          {moreError && (
            <p className="mt-2 text-sm text-destructive">
              Couldn&apos;t load more rows.
            </p>
          )}
        </div>
      )}
      <div ref={sentinelRef} aria-hidden className="h-px" />

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