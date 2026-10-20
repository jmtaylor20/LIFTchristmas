import { isSandbox } from "@/lib/sandbox";

/** Shown on every page while the site is in test mode. */
export function SandboxBanner({ admin = false }: { admin?: boolean }) {
  if (!isSandbox()) return null;
  return (
    <div className="no-print bg-star-500 px-4 py-2 text-center text-sm font-semibold text-ink">
      🧪 Test mode: the site is being tested and anything entered will be deleted. No emails are sent.
      {admin && (
        <a href="/admin/sandbox" className="ml-2 text-ink underline">Open Test Outbox</a>
      )}
    </div>
  );
}
