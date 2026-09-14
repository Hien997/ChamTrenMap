// Public shell for everything under /admin (including /admin/login).
// The auth guard + nav chrome live in `(protected)/layout.tsx` so that the
// login page is reachable without an ADMIN session.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}