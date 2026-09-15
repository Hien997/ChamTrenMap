import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import { LogOutIcon, WaypointsIcon } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";

function Brand() {
  return (
    <Link
      href="/admin"
      className="inline-flex items-center gap-2 text-white"
    >
      <WaypointsIcon aria-hidden className="size-5 text-[oklch(0.7_0.095_200)]" />
      <span className="text-sm font-semibold tracking-tight">Chắm trên Map</span>
    </Link>
  );
}

const logoutLink =
  "inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/60 transition-colors duration-200 hover:bg-white/5 hover:text-white";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* The chart rail — deep Gulf night, fixed on desktop. */}
      <aside className="bg-[oklch(0.24_0.03_235)] lg:fixed lg:inset-y-0 lg:left-0 lg:w-60">
        {/* Mobile top bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 lg:hidden">
          <Brand />
          <div className="flex items-center gap-1">
            <AdminNav orientation="horizontal" />
            <Link
              href="/admin/logout"
              aria-label="Log out"
              className={`${logoutLink} justify-center px-2`}
            >
              <LogOutIcon aria-hidden className="size-4" />
            </Link>
          </div>
        </div>

        {/* Desktop rail */}
        <div className="hidden lg:flex lg:h-full lg:flex-col lg:gap-10 lg:px-5 lg:py-7">
          <Brand />
          <AdminNav orientation="vertical" />
          <div className="mt-auto border-t border-white/10 pt-4">
            <p className="mb-2 truncate px-2 text-xs text-white/45">
              {user.email}
            </p>
            <Link href="/admin/logout" className={logoutLink}>
              <LogOutIcon aria-hidden className="size-3.5" />
              Log out
            </Link>
          </div>
        </div>
      </aside>

      <main className="px-4 py-8 sm:px-6 sm:py-10 lg:pl-[17rem] lg:pr-8">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}