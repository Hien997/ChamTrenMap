"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { KeyRoundIcon, PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { buttonVariants, Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, StatusChip } from "@/components/admin/ui";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { usePaginatedAdminList } from "@/hooks/usePaginatedAdminList";
import type { PrivateTourListItem } from "@/types";

const AdminPrivateToursListPage = () => {
  const {
    items: tours,
    total,
    error,
    retry,
    hasMore,
    loadMore,
    loadingMore,
    moreError,
    removeItem,
  } = usePaginatedAdminList<PrivateTourListItem>("/api/admin/private-tours");

  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const confirmDelete = useCallback(() => {
    const target = confirmTarget;
    setConfirmOpen(false);
    if (!target) {
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/admin/private-tours/${target.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.ok) {
        removeItem(target.id);
      }
    });
  }, [confirmTarget, removeItem]);

  return (
    <div>
      <PageHeader
        title="Private tours"
        actions={
          <Link
            href="/admin/private-tours/new"
            className={buttonVariants({ size: "sm" })}
          >
            <PlusIcon aria-hidden className="size-4" />
            New private tour
          </Link>
        }
      />

      <p className="mb-4 text-sm text-muted-foreground">
        Each tour has its own access code. The visitor needs both the code and
        the customer phone number you set here.
      </p>

      {error ? (
        <div className="rounded-lg border bg-card px-6 py-12 text-center">
          <p className="font-medium">Couldn&apos;t load private tours</p>
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
      ) : total === 0 ? (
        <div className="rounded-lg border border-dashed bg-card/50 px-6 py-12 text-center">
          <p className="font-medium">No private tours yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create one, pick its stops, then send the code to your customer.
          </p>
          <Link
            href="/admin/private-tours/new"
            className={buttonVariants({ size: "sm", className: "mt-4" })}
          >
            <PlusIcon aria-hidden className="size-4" />
            New private tour
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
          {tours.map((tour) => (
            <li
              key={tour.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4"
            >
              <div className="min-w-0 flex-1 basis-56">
                <div className="flex items-center gap-2.5">
                  <h3 className="truncate font-medium">{tour.name}</h3>
                  <StatusChip status={tour.status} />
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {tour.customerName || tour.customerPhone}
                </p>
              </div>

              <code className="inline-flex items-center gap-1.5 rounded bg-muted px-2 py-1 font-mono text-sm tracking-widest">
                <KeyRoundIcon aria-hidden className="size-3.5" />
                {tour.code}
              </code>

              <span className="text-sm tabular-nums text-muted-foreground">
                {tour.slotsUsed}/{tour.maxSlots} slots · {tour.stopCount}{" "}
                {tour.stopCount === 1 ? "stop" : "stops"}
              </span>

              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/private-tours/${tour.id}`}
                  aria-label={`Edit ${tour.name}`}
                  className={buttonVariants({
                    variant: "ghost",
                    size: "icon",
                  })}
                >
                  <PencilIcon aria-hidden className="size-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmTarget({ id: tour.id, name: tour.name });
                    setConfirmOpen(true);
                  }}
                  disabled={isPending}
                  aria-label={`Delete ${tour.name}`}
                  className={buttonVariants({
                    variant: "ghost",
                    size: "icon",
                  })}
                >
                  <TrashIcon aria-hidden className="size-4 text-destructive" />
                </button>
              </div>
            </li>
          ))}
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

      <ConfirmDelete
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmTarget?.name ?? ""}
        onConfirm={confirmDelete}
        pending={isPending}
      />
    </div>
  );
};

export default AdminPrivateToursListPage;
