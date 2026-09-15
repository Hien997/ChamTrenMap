"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { WaypointsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      const json = await res.json();
      if (json.ok) {
        router.push("/admin");
      } else {
        setError(json.error || "Login failed");
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8 flex items-center gap-2.5">
        <WaypointsIcon aria-hidden className="size-6 text-primary" />
        <span className="text-lg font-semibold tracking-tight">
          Chắm trên Map
        </span>
      </div>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-lg border bg-card p-6 sm:p-8"
      >
        <h1 className="text-lg font-medium tracking-tight">Log in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to edit tours and checkpoints.
        </p>

        {error ? (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isPending}
            />
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="mt-6 w-full">
          {isPending ? "Checking…" : "Log in"}
        </Button>
      </form>
    </div>
  );
}