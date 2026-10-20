import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/manifests/family.webmanifest",
  icons: { apple: "/icons/family-apple.png" },
  appleWebApp: { title: "LIFT Family", capable: true, statusBarStyle: "default" },
};

export default function FamilyApp({ children }: { children: React.ReactNode }) {
  return children;
}
