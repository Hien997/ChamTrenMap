"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusIcon, EditIcon, TrashIcon } from "lucide-react";

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
  return fetch("/api/admin/checkpoints", { cache: "no-store" }).then((res) => res.json()).then((json) => {
    if (!json.ok) throw new Error(json.error || "Failed to load");
    return json.checkpoints;
  });
}

export default function AdminCheckpointsListPage() {
  const [checkpoints, setCheckpoints] = useState<TCheckpoint[] | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!checkpoints) {
      fetchCheckpoints().then(setCheckpoints).catch(() => {});
    }
  }, [checkpoints]);

  const onDelete = (slug: string) => {
    if (!confirm(`Delete checkpoint "${slug}"?`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/checkpoints/${slug}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        setCheckpoints((prev) => prev?.filter((c) => c.slug !== slug) ?? null);
      }
    });
  };

  if (!checkpoints) {
    return <div className="text-gray-500">Loading checkpoints…</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Checkpoints</h1>
        <Link href="/admin/checkpoints/new" className={buttonVariants()}>
          <PlusIcon className="mr-1 h-4 w-4" />
          New Checkpoint
        </Link>
      </div>

      <div className="space-y-3">
        {checkpoints.map((cp) => (
          <Card key={cp.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-semibold">{cp.vi?.name || cp.slug}</h3>
                <p className="text-sm text-gray-600">{cp.en?.name || ""}</p>
                <p className="text-xs text-gray-500">
                  {cp.priceVnd != null ? `$${cp.priceVnd} (${cp.priceKind})` : "Free"} · GPS: {cp.latitude.toFixed(4)}, {cp.longitude.toFixed(4)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/checkpoints/${cp.slug}`}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  <EditIcon className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => onDelete(cp.slug)}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                  disabled={isPending}
                >
                  <TrashIcon className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}