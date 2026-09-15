"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/admin/ui";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { formatVnd } from "@/lib/format";

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

function fetchCheckpoints(): Promise<TCheckpoint[]> {
  return fetch("/api/admin/checkpoints", { cache: "no-store" })
    .then((res) => res.json())
    .then((json) => {
      if (!json.ok) throw new Error(json.error || "Failed to load");
      return json.checkpoints as TCheckpoint[];
    });
}

export default function AdminCheckpointsListPage() {
  const [checkpoints, setCheckpoints] = useState<TCheckpoint[] | null>(null);
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    fetchCheckpoints()
      .then((data) => {
        if (!cancelled) setCheckpoints(data);
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
    fetchCheckpoints()
      .then(setCheckpoints)
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
      const res = await fetch(`/api/admin/checkpoints/${target.slug}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        setCheckpoints((prev) => prev?.filter((c) => c.slug !== target.slug) ?? null);
      }
    });
  }, [confirmTarget, setConfirmOpen, setCheckpoints]);

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
      ) : checkpoints.length === 0 ? (
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
              cp.priceVnd != null
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
                    className={buttonVariants({ variant: "ghost", size: "icon" })}
                  >
                    <PencilIcon aria-hidden className="size-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDelete(cp.slug, name)}
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