"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { WaypointsIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toFieldErrors } from "@/lib/admin-form";
import { loginSchema } from "@/lib/validations/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setErrors({});
    const formData = new FormData(e.currentTarget);

    const credentials = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    // Client-side validation so missing fields are flagged inline instead of
    // bouncing off the API.
    const parsed = loginSchema.safeParse(credentials);
    if (!parsed.success) {
      setErrors(
        toFieldErrors(
          parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        ),
      );
      toast.error("Please fix the errors in the form.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });

        const json: { ok: boolean; error?: string } = await res.json();
        if (json.ok) {
          toast.success("Signed in successfully!");
          router.push("/admin");
        } else {
          const message = json.error || "Login failed";
          setError(message);
          toast.error(message);
        }
      } catch {
        const message = "Network error. Please try again.";
        setError(message);
        toast.error(message);
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
        noValidate
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
            <Label htmlFor="email">
              Email<span aria-hidden className="ml-0.5 text-destructive">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email ? (
              <p id="email-error" className="text-xs text-destructive" aria-live="polite">
                {errors.email}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">
              Password<span aria-hidden className="ml-0.5 text-destructive">*</span>
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isPending}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password ? (
              <p id="password-error" className="text-xs text-destructive" aria-live="polite">
                {errors.password}
              </p>
            ) : null}
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="mt-6 w-full">
          {isPending ? "Checking…" : "Log in"}
        </Button>
      </form>
    </div>
  );
}