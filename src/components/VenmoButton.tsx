import { cleanHandle, venmoPayUrl } from "@/lib/venmo";

/** Opens Venmo (the app on phones) to pay the ministry, with a note filled in. */
export function VenmoButton({ handle, className = "btn-outline" }: { handle: string; className?: string }) {
  return (
    <a href={venmoPayUrl(handle, null, "LIFT Community Christmas")} target="_blank" rel="noopener noreferrer" className={className}>
      Venmo @{cleanHandle(handle)}
    </a>
  );
}
