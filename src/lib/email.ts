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
  return `<p style="margin:24px 0"><a href="${href}" style="background:#dfab61;color:#17232a;padding:13px 24px;border-radius:999px;text-decoration:none;font-weight:700;display:inline-block">${esc(label)}</a></p>`;
}

export function layout(inner: string) {
  return `<!doctype html><html><body style="margin:0;background:#eef4f6;font-family:'Trebuchet MS',Arial,sans-serif;color:#17232a">
<div style="max-width:600px;margin:0 auto;padding:24px 16px">
  <div style="background:#6b8fa5;border-radius:16px 16px 0 0;overflow:hidden;text-align:center">
    <div style="padding:20px 24px 4px;font-family:Georgia,'Times New Roman',serif;color:#ffffff">
      <span style="font-size:28px;font-weight:bold;letter-spacing:1px">LIFT<span style="color:#f2d79d;font-size:15px;vertical-align:top">&#10022;</span></span>
      <span style="display:inline-block;margin-left:10px;padding-left:10px;border-left:1px solid rgba(255,255,255,.5);font-family:'Trebuchet MS',Arial,sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;line-height:1.25;text-align:left;vertical-align:middle">Community<br/>Christmas</span>
    </div>
    <img src="${siteUrl("/brand/community-christmas.jpg")}" alt="" width="568" style="display:block;width:100%;max-width:568px;height:auto;margin:0 auto"/>
  </div>
  <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:28px;font-size:15px;line-height:1.6">${inner}</div>
  <p style="text-align:center;font-size:12px;color:#55636a;margin-top:20px">
    <span style="font-family:Georgia,serif;font-style:italic">&ldquo;${esc(site.verse.text)}&rdquo; &mdash; ${esc(site.verse.ref)}</span><br/>
    ${esc(site.fullName)} &middot; ${esc(site.motto)} &middot; ${esc(site.contactEmail)}
  </p>
</div></body></html>`;
}
