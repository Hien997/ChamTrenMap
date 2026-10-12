import { Skeleton } from "@/components/ui/skeleton";

/** Stable keys — a literal list, so the list never trips `no-array-index-key`. */
const SKELETON_CARDS = ["a", "b", "c", "d", "e", "f"] as const;

/**
 * Route-level Suspense fallback for every public page.
 *
 * All of them render the same shell (sticky header → heading → content), so one
 * skeleton covers home, tour/checkpoint detail and the listings. Keeping it at
 * this segment also means a slow dynamic route (`/map/[slug]`, `/checkpoints/[slug]`)
 * shows progress instead of a blank screen while the visitor's session resolves.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-40 border-b bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-4">
          <Skeleton className="h-5 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <Skeleton className="h-9 w-2/3 max-w-md" />
        <Skeleton className="mt-3 h-5 w-full max-w-xl" />

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SKELETON_CARDS.map((key) => (
            <div key={key} className="space-y-3">
              <Skeleton className="aspect-[16/9] w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
