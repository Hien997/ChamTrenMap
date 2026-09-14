import { getAdminUser } from "@/lib/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PlusIcon, MapIcon, StoreIcon } from "lucide-react";

export default async function AdminDashboard() {
  const user = await getAdminUser();
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Link
          href="/admin/tours/new"
          className={buttonVariants({ size: "sm" })}
        >
          <PlusIcon className="mr-1 h-4 w-4" />
          New Tour
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/admin/tours"
          className="group block rounded-lg border bg-white p-6 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <MapIcon className="h-8 w-8 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold">Tours</h2>
              <p className="text-sm text-gray-600">Manage tour content and ordering</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/checkpoints"
          className="group block rounded-lg border bg-white p-6 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <StoreIcon className="h-8 w-8 text-green-500" />
            <div>
              <h2 className="text-xl font-semibold">Checkpoints</h2>
              <p className="text-sm text-gray-600">Edit guides, prices, and locations</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}