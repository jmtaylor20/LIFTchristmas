import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  manifest: "/manifests/admin.webmanifest",
  icons: { apple: "/icons/admin-apple.png" },
  appleWebApp: { title: "LIFT Admin", capable: true, statusBarStyle: "black-translucent" },
  robots: { index: false },
};

// The installed admin app draws under the iPhone status bar and home bar;
// the header and tab bar pad themselves with the safe-area insets.
export const viewport: Viewport = { viewportFit: "cover" };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return children;
}
