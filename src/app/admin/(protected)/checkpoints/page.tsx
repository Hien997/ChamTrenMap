"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { PencilIcon, PlusIcon, SearchIcon, TrashIcon } from "lucide-react";
import { buttonVariants, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/admin/ui";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { formatVnd } from "@/lib/format";
import { usePaginatedAdminList } from "@/hooks/usePaginatedAdminList";

type TCheckpoint = {
  id: string;
  slug: string;
  latitude: number;
  longitude: number;
  priceVnd: number | null;
  priceKind: "TICKET" | "FOOD";
  vi: { name: string } | null;
  en: { name: string } | null;
};

export default function AdminCheckpointsListPage() {
  const {
    items: checkpoints,
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
  } = usePaginatedAdminList<TCheckpoint>("/api/admin/checkpoints");

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
      const res = await fetch(`/api/admin/checkpoints/${target.slug}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.ok) removeItem(target.id);
    });
  }, [confirmTarget, removeItem]);

  return (
    <div>
      <PageHeader
        title="Checkpoints"
        actions={
          <Link
            href="/admin/checkpoints/new"
            className={buttonVariants({ size: "sm" })}
          >
            <PlusIcon aria-hidden className="size-4" />
            New checkpoint
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
          placeholder="Search checkpoints by name or slug…"
          aria-label="Search checkpoints"
          className="pl-8"
        />
      </div>

      {checkpoints !== null && total > 0 && (
        <p className="mb-2 text-sm text-muted-foreground">
          Showing {checkpoints.length} of {total}{" "}
          {total === 1 ? "checkpoint" : "checkpoints"}
          {appliedQuery !== "" ? ` for “${appliedQuery}”` : ""}
        </p>
      )}

      {error ? (
        <div className="rounded-lg border bg-card px-6 py-12 text-center">
          <p className="font-medium">Couldn&apos;t load checkpoints</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check the connection, then try again.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={retry}>
            Retry
          </Button>
        </div>
      ) : checkpoints === null ? (
        <div className="space-y-2" aria-hidden>
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      ) : checkpoints.length === 0 && appliedQuery !== "" ? (
        <div className="rounded-lg border border-dashed bg-card/50 px-6 py-12 text-center">
          <p className="font-medium">No checkpoints match “{appliedQuery}”</p>
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
          <p className="font-medium">No checkpoints yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the first place on the map, then write its guide.
          </p>
          <Link
            href="/admin/checkpoints/new"
            className={buttonVariants({ size: "sm", className: "mt-4" })}
          >
            <PlusIcon aria-hidden className="size-4" />
            New checkpoint
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
          {checkpoints.map((cp) => {
            const name = cp.vi?.name || cp.slug;
            const price =
              cp.priceVnd !== null
                ? `${cp.priceKind === "FOOD" ? "Food" : "Ticket"} ${formatVnd(cp.priceVnd)}`
                : "Free";
            return (
              <li
                key={cp.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4"
              >
                <div className="min-w-0 flex-1 basis-56">
                  <h3 className="truncate font-medium">{name}</h3>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {cp.en?.name || cp.slug}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm tabular-nums">{price}</p>
                  <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                    {cp.latitude.toFixed(4)}, {cp.longitude.toFixed(4)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/checkpoints/${cp.slug}`}
                    aria-label={`Edit ${name}`}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "icon",
                    })}
                  >
                    <PencilIcon aria-hidden className="size-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDelete(cp.id, cp.slug, name)}
                    disabled={isPending}
                    aria-label={`Delete ${name}`}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "icon",
                    })}
                  >
                    <TrashIcon
                      aria-hidden
                      className="size-4 text-destructive"
                    />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {checkpoints !== null && hasMore && (
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
