# LIFT Community Christmas

Website and ministry admin for **LIFT Community Christmas Ministry**, serving children in Reeltown & Tallassee, Alabama.

## What's in it

**For families (public)**
- `/apply`: Christmas sponsorship application (parent info, household, each child with sizes and interests). It closes automatically at the application deadline.
- `/family/<private link>`: emailed to the parent. Shows their status. Once approved, they build a wish list for each child and submit it. `/family` re-sends a lost link.

**For givers (public)**
- `/angels`: the Angel Tree. Anonymous "Angel #12 · Girl, age 7" cards (no names), filterable by age, gender, and "whole list available".
- `/angels/<number>`: sponsor a child's entire list, or tick just the items you can cover.
- `/angels/items`: every open gift sorted by price (under $25, $25–50, …), so there's something for every budget.
- `/give`: all the ways to give, including the Amazon wish list (givers can report what they ordered).
- `/donate`: online giving through Stripe, plus check / in-person instructions.
- `/account`: **giver profiles**. Sign-in is by emailed link, no password. Givers see their angels, gift status, donations, and printable yearly **giving statements** for taxes.

**For the ministry (`/admin`, password protected)**
- Dashboard: applications to review, angel coverage, money raised, fund balance, and the dollar value still needed.
- Applications: approve, waitlist, or deny (with optional email to the family). **Approvals are capped at 5 years per family**; the cap is adjustable per season and enforced on the server.
- Angels & Lists: every angel, list, and item status (needed → committed → received, or "ministry buying" with actual $ spent). Add sponsors by hand from phone calls or paper sheets.
- Givers: everyone who has sponsored, donated, or sent gifts, with **how many years** they've sponsored.
- Money & Gifts: online donations plus cash and checks recorded by hand, and Amazon / drop-off gifts.
- Family History: every family across all years, years approved, and years remaining under the cap.
- Tax Statements: preview, send, or resend year-end statements.
- Gift Tags: printable Angel Tree tags (anonymous) and bag labels for pickup day.
- Seasons & Deadlines: one season per year with application, wish-list, and gift/money deadlines. Starting a new season carries settings forward; people and history persist.
- CSV exports of angels/items, givers, and applications.

**Automatic emails** (via [Resend](https://resend.com)): application received, decision, sponsor confirmation, donation receipts, sign-in links, and owner alerts. **Giving statements are emailed automatically every January 15** for the prior year (`vercel.json` cron → `/api/cron/giving-statements`).

## Run it locally

```bash
cp .env.example .env        # fill in DATABASE_URL etc.
npm install
npx prisma migrate dev      # creates tables
npm run db:seed             # optional demo data (5 angels)
npm run dev                 # http://localhost:3000, admin at /admin
```

Without `RESEND_API_KEY`, emails are printed to the server log. Without `STRIPE_SECRET_KEY`, the Donate page shows only the mail-in instructions.

## Deploying (suggested: Vercel + Supabase or Neon Postgres)

1. Create a Postgres database and set `DATABASE_URL` / `DIRECT_URL`.
2. Import the repo into Vercel and add every variable from `.env.example`. Use a long `ADMIN_PASSWORD`, a random 32+ character `SESSION_SECRET`, and a random `CRON_SECRET`.
3. Set the build command to `npx prisma migrate deploy && npm run build`.
4. In Stripe, add a webhook to `https://<your-site>/api/stripe/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `checkout.session.expired`. Put the signing secret in `STRIPE_WEBHOOK_SECRET`.
5. Verify your sending domain in Resend and set `EMAIL_FROM`.
6. Sign in at `/admin`, open **Seasons & Deadlines**, create this year's season, and set the deadlines, Amazon list link, and drop-off instructions.

## Adding logos, photos, and testimonials

- **Logos:** save the angel image as `public/brand/angel.png` (transparent background is best) and the full artwork as `public/brand/community-christmas.jpg`. Until then a star shows in their place.
- **Photos:** put them in `public/photos/` and set the paths in `src/content/site.ts` (`photos`).
- **Testimonials and site wording:** edit `src/content/site.ts`, then set `placeholder: false` on each testimonial you fill in.
- **Tax receipt details:** set `ORG_LEGAL_NAME`, `ORG_EIN`, and `ORG_MAILING_ADDRESS`.
