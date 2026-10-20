import { cookies } from "next/headers";
import { db } from "./db";

export async function getActiveSeason() {
  return (
    (await db.season.findFirst({ where: { isActive: true } })) ??
    (await db.season.findFirst({ orderBy: { year: "desc" } }))
  );
}

export const ADMIN_SEASON_COOKIE = "lift_admin_season";

/** The season the admin is currently looking at (defaults to the active one). */
export async function getAdminSeason() {
  const id = (await cookies()).get(ADMIN_SEASON_COOKIE)?.value;
  if (id) {
    const s = await db.season.findUnique({ where: { id } });
    if (s) return s;
  }
  return getActiveSeason();
}

type DeadlineSeason = {
  applicationsOpen: boolean;
  applicationDeadline: Date | null;
  wishlistDeadline: Date | null;
  giftDeadline: Date | null;
};

const past = (d: Date | null) => !!d && d.getTime() < Date.now();

export function applicationsAreOpen(s: DeadlineSeason | null) {
  return !!s && s.applicationsOpen && !past(s.applicationDeadline);
}

export function wishlistsAreOpen(s: DeadlineSeason | null) {
  return !!s && !past(s.wishlistDeadline);
}

export function sponsoringIsOpen(s: DeadlineSeason | null) {
  return !!s && !past(s.giftDeadline);
}
