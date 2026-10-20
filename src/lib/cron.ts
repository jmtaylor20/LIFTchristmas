import { safeEqual } from "./tokens";

/** Scheduled jobs call /api/cron/* with "Authorization: Bearer <CRON_SECRET>". */
export function cronAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  return !!secret && safeEqual(req.headers.get("authorization") ?? "", `Bearer ${secret}`);
}
