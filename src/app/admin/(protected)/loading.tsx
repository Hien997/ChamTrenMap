import { Skeleton } from "@/components/ui/skeleton";

/**
 * Streaming skeleton for every protected admin route. The dashboard and list
 * pages are `force-dynamic` server components that query the database, so a
 * navigation would otherwise flash a blank page while they resolve. This mirrors
 * the real layout (heading → 4 stat tiles → two panels) so nothing shifts when
 * the content arrives.
 */
const AdminLoading = () => {
  return (
    <div>
      <div className="mb-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="rounded-lg border bg-card px-5 py-4"
            aria-hidden
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-8 w-14" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-lg border bg-card"
            aria-hidden
          >
            <div className="border-b px-5 py-3">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-4 p-5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminLoading;
