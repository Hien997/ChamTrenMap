"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboardIcon, MapIcon, MapPinIcon } from "lucide-react";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboardIcon },
  { href: "/admin/tours", label: "Tours", icon: MapIcon },
  { href: "/admin/checkpoints", label: "Checkpoints", icon: MapPinIcon },
] as const;

/**
 * The chart rail's navigation. Vertical (desktop sidebar): icon + label.
 * Horizontal (mobile top bar): icon only, labels for screen readers.
 */
export function AdminNav({ orientation }: { orientation: "vertical" | "horizontal" }) {
  const pathname = usePathname();
  const vertical = orientation === "vertical";

  return (
    <nav
      aria-label="Admin"
      className={vertical ? "flex w-full flex-col gap-1" : "flex items-center gap-1"}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors duration-200 ${
              vertical ? "" : "justify-center"
            } ${
              active
                ? "bg-white/10 text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon aria-hidden className="size-4 shrink-0" />
            <span className={vertical ? "" : "sr-only"}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}