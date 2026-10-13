import Link from "next/link";
import { LogOutIcon, WaypointsIcon } from "lucide-react";
import { requireAdminPage } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin/AdminNav";

const Brand = () => {
  return (
    <Link
      href="/admin"
      className="inline-flex items-center gap-2 text-foreground"
    >
      <WaypointsIcon
        aria-hidden
        className="size-5 text-[oklch(0.5_0.085_210)]"
      />
      <span className="text-sm font-semibold tracking-tight">
        Chắm trên Map
      </span>
    </Link>
  );
};

const logoutLink =
  "inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground";

const AdminProtectedLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const user = await requireAdminPage();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Compact light rail — gọn, dùng --sidebar tokens để bật dark mode sau này. */}
      <aside className="border-b border-sidebar-border bg-sidebar lg:fixed lg:inset-y-0 lg:left-0 lg:w-56 lg:border-r lg:border-b-0">
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
        <div className="hidden lg:flex lg:h-full lg:flex-col lg:gap-8 lg:px-4 lg:py-6">
          <Brand />
          <AdminNav orientation="vertical" />
          <div className="mt-auto border-t border-sidebar-border pt-4">
            <p className="mb-2 truncate px-2 text-xs text-muted-foreground">
              {user.email}
            </p>
            <Link href="/admin/logout" className={logoutLink}>
              <LogOutIcon aria-hidden className="size-3.5" />
              Log out
            </Link>
          </div>
        </div>
      </aside>

      <main className="px-4 py-8 sm:px-6 sm:py-10 lg:pl-[16rem] lg:pr-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
};

export default AdminProtectedLayout;
