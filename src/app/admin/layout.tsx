import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/manifests/admin.webmanifest",
  icons: { apple: "/icons/admin-apple.png" },
  appleWebApp: { title: "LIFT Admin", capable: true, statusBarStyle: "black-translucent" },
  robots: { index: false },
};

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return children;
}
