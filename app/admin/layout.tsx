import type { Metadata } from "next";

// Nested layout for every /admin route. The <html> and <body> tags live in the
// ROOT layout (app/layout.tsx) — that file must exist for the build to succeed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
