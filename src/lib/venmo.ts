/** Venmo link that opens the app (on phones) with the amount and note filled in. */
export function venmoPayUrl(handle: string, amountCents?: number | null, note?: string) {
  const params = new URLSearchParams({ txn: "pay" });
  if (amountCents) params.set("amount", (amountCents / 100).toFixed(2));
  if (note) params.set("note", note);
  return `https://venmo.com/${encodeURIComponent(cleanHandle(handle))}?${params}`;
}

export function venmoProfileUrl(handle: string) {
  return `https://venmo.com/u/${encodeURIComponent(cleanHandle(handle))}`;
}

export function cleanHandle(handle: string) {
  return handle.trim().replace(/^@/, "");
}
