import { site } from "@/content/site";

export function siteUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

type Email = { to: string; subject: string; html: string; text?: string; replyTo?: string };

/**
 * Sends through Resend when RESEND_API_KEY is set; otherwise logs the message
 * so the site still works during setup. Never throws, so a failed email never
 * loses a family's application or a sponsor's commitment.
 */
export async function sendEmail(msg: Email): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email:not-configured] to=${msg.to} subject="${msg.subject}"\n${msg.text ?? stripHtml(msg.html)}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || `${site.name} <onboarding@resend.dev>`,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text ?? stripHtml(msg.html),
        reply_to: msg.replyTo || site.contactEmail,
      }),
    });
    if (!res.ok) {
      console.error(`[email] send failed ${res.status}: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send error", err);
    return false;
  }
}

export async function notifyAdmin(subject: string, bodyHtml: string) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) return;
  await sendEmail({ to, subject: `[LIFT] ${subject}`, html: layout(bodyHtml) });
}

export function esc(s: string | null | undefined) {
  return (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h\d|tr|li)>/gi, "\n")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&mdash;/g, "—")
    .replace(/&middot;/g, "·")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function button(href: string, label: string) {
  return `<p style="margin:24px 0"><a href="${href}" style="background:#a2552a;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">${esc(label)}</a></p>`;
}

export function layout(inner: string) {
  return `<!doctype html><html><body style="margin:0;background:#eef3f8;font-family:Georgia,'Times New Roman',serif;color:#1f2a24">
<div style="max-width:600px;margin:0 auto;padding:32px 20px">
  <div style="text-align:center;margin-bottom:20px">
    <div style="font-size:13px;letter-spacing:3px;color:#a2552a;text-transform:uppercase">&#10022; ${esc(site.communities)} &#10022;</div>
    <div style="font-size:26px;font-weight:bold;color:#42617f">${esc(site.name)}</div>
  </div>
  <div style="background:#fff;border-radius:16px;padding:28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6">${inner}</div>
  <p style="text-align:center;font-size:12px;color:#6b6b6b;margin-top:20px;font-family:Helvetica,Arial,sans-serif">
    &ldquo;${esc(site.verse.text)}&rdquo; &mdash; ${esc(site.verse.ref)}<br/>
    ${esc(site.fullName)} &middot; ${esc(site.contactEmail)}
  </p>
</div></body></html>`;
}
