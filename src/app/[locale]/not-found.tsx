import Link from "next/link";
import { CompassIcon } from "lucide-react";

export default function LocaleNotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 px-4 text-center">
      <CompassIcon aria-hidden className="size-10 text-primary/70" />
      <h1 className="text-2xl font-bold">404</h1>
      <p className="text-muted-foreground">
        Trang bạn tìm kiếm không tồn tại. / Page not found.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Về trang chủ / Back home
      </Link>
    </div>
  );
}
