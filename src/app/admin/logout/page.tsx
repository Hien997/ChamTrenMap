"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AdminLogoutPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onLogout = () => {
    startTransition(async () => {
      await fetch("/api/admin/logout", { method: "POST" });
      router.replace("/admin/login");
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {isPending ? "Logging out…" : "Ready to log out?"}
        </p>
        <Button onClick={onLogout} disabled={isPending} className="mt-4">
          {isPending ? "One moment…" : "Log out"}
        </Button>
      </div>
    </div>
  );
}
