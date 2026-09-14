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
    <div className="p-6">
      <p>Logging out…</p>
      <Button onClick={onLogout} disabled={isPending}>
        {isPending ? "Logging out…" : "Confirm logout"}
      </Button>
    </div>
  );
}