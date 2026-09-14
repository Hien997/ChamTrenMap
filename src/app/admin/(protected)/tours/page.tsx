"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusIcon, EditIcon, TrashIcon } from "lucide-react";

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
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!tours) {
      fetchTours().then(setTours).catch(() => {});
    }
  }, [tours]);

  const onDelete = (slug: string) => {
    if (!confirm(`Delete tour "${slug}"?`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/tours/${slug}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        setTours((prev) => prev?.filter((t) => t.slug !== slug) ?? null);
      }
    });
  };

  if (!tours) {
    return <div className="text-gray-500">Loading tours…</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tours</h1>
        <Link href="/admin/tours/new" className={buttonVariants()}>
          <PlusIcon className="mr-1 h-4 w-4" />
          New Tour
        </Link>
      </div>

      <div className="space-y-3">
        {tours.map((tour) => (
          <Card key={tour.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-semibold">{tour.vi?.name || tour.slug}</h3>
                <p className="text-sm text-gray-600">{tour.en?.name || ""}</p>
                <p className="text-xs text-gray-500">
                  {tour.checkpointCount} checkpoints · {tour.status}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/tours/${tour.slug}`}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  <EditIcon className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => onDelete(tour.slug)}
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