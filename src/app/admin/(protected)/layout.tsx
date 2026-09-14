import { getAdminUser } from "@/lib/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MapIcon, StoreIcon } from "lucide-react";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold">Admin — ChamTrenMap</span>
            <div className="flex gap-4">
              <Link href="/admin/tours" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                <MapIcon className="mr-1 h-4 w-4" />
                Tours
              </Link>
              <Link href="/admin/checkpoints" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                <StoreIcon className="mr-1 h-4 w-4" />
                Checkpoints
              </Link>
            </div>
          </div>
          <Link href="/admin/logout" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Logout
          </Link>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}