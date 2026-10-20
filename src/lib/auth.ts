import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { sign, verify } from "./tokens";

const ADMIN_COOKIE = "lift_admin";
const GIVER_COOKIE = "lift_giver";
const DAY = 24 * 60 * 60 * 1000;

const cookieOpts = (maxAgeMs: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: Math.floor(maxAgeMs / 1000),
});

export async function setAdminSession() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, sign({ role: "admin", exp: Date.now() + 14 * DAY }), cookieOpts(14 * DAY));
}

export async function clearAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin() {
  const jar = await cookies();
  return verify<{ role: string }>(jar.get(ADMIN_COOKIE)?.value)?.role === "admin";
}

/** Call at the top of every admin page and admin server action. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function setGiverSession(sponsorId: string) {
  const jar = await cookies();
  jar.set(GIVER_COOKIE, sign({ sid: sponsorId, exp: Date.now() + 60 * DAY }), cookieOpts(60 * DAY));
}

export async function clearGiverSession() {
  (await cookies()).delete(GIVER_COOKIE);
}

export async function currentGiver() {
  const jar = await cookies();
  const data = verify<{ sid: string }>(jar.get(GIVER_COOKIE)?.value);
  if (!data) return null;
  return db.sponsor.findUnique({ where: { id: data.sid } });
}
