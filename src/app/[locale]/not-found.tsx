import Link from "next/link";

export default function LocaleNotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-5xl">🧭</p>
      <h1 className="text-2xl font-bold">404</h1>
      <p className="text-muted-foreground">
        Trang bạn tìm kiếm không tồn tại. / Page not found.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        ← /vi
      </Link>
    </div>
  );
}
