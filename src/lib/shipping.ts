import { esc } from "./email";

/**
 * The "ship to" block sponsors paste into Amazon (or any store). Putting the
 * angel number in the name line means every box arrives already tagged.
 */
export function shipToLines(angelNumber: number | null, address: string) {
  return [`LIFT Christmas - Angel #${angelNumber}`, ...address.split("\n").map((l) => l.trim()).filter(Boolean)];
}

export function shipToHtml(angelNumber: number | null, address: string) {
  return `<div style="margin:12px 0;padding:12px 16px;border:2px dashed #6b8fa5;border-radius:12px;font-family:monospace;font-size:14px;line-height:1.5">${shipToLines(angelNumber, address).map(esc).join("<br/>")}</div>
<p style="font-size:13px;color:#555">Use exactly this name line, &ldquo;LIFT Christmas - Angel #${angelNumber}&rdquo;, so we know which child the box is for. Choose &ldquo;gift receipt / hide prices&rdquo; if offered, and please don't gift-wrap.</p>`;
}
