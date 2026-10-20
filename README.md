# LIFT Community Christmas

Website and ministry admin for **LIFT Community Christmas** (LIFT Ministries), serving children in Reeltown & Tallassee, Alabama.

Built with Next.js, Postgres (Supabase), and Prisma. Hosted on Netlify.

## What's in it

**Families**, in English or Spanish:
- `/apply`: Christmas sponsorship application. It closes automatically at the application deadline.
- `/family/<private link>`: emailed to the parent. They see their status, build a wish list for each child once approved, see pickup details, and **send thank-you notes** (with an optional photo of a card) to their sponsors.
- `/family`: re-sends a lost link.

**Givers**:
- `/angels`: the Angel Tree. Anonymous "Angel #12 · Girl, age 7" cards; names are never shown.
- `/angels/<number>`: sponsor a child's whole list, or pick just a few items. Sponsors choose to **drop gifts off** or **order online and ship to the ministry**. Shippers get a ship-to label with "LIFT Christmas - Angel #12" in the name line, so every box arrives tagged, and can add tracking numbers in their profile.
- `/angels/items`: every open gift sorted by price, for any budget.
- `/give`: all the ways to give, including the Amazon wish list.
- `/donate`: **Venmo, check, or cash**. The giver says what they're sending; the gift shows up for the owner as "waiting to confirm" until she marks it received.
- `/account`: giver profile, signed into by emailed link (no password). Shows their angels, gifts, donations, thank-you notes from families, and yearly giving statements.

**Ministry admin** (`/admin`):
- Dashboard: applications to review, angel coverage, money received, fund balance, the dollar value still needed, items waiting on you, and reminder buttons.
- Applications: approve, waitlist, or deny, with an email to the family in their language. **Each family can be approved at most 5 years**; the cap is adjustable per season and enforced on the server.
- Angels & Lists: each item's status (needed, committed, received, or "ministry buying" with the actual $ spent), how sponsors are delivering, tracking numbers, and adding sponsors by hand.
- Givers, with how many years each has sponsored. Family History across all years.
- Money & Gifts: confirm reported Venmo/check/cash gifts (this sends the receipt), record gifts directly, and track Amazon/drop-off gifts.
- Thank-You Notes: review and lightly edit a family's note before it's emailed to their sponsors.
- Giving Statements: preview, send, or resend year-end statements.
- Gift Tags: printable Angel Tree tags and pickup-day bag labels.
- Pickup Day: a phone-friendly check-off by last name, phone, or angel #.
- Seasons & Deadlines: one season per year. It holds the deadlines, Venmo username, Amazon list, shipping address, drop-off and pickup details.

**Automatic emails** (via [Resend](https://resend.com)):
- Application received, decisions, sponsor confirmations, receipts, and sign-in links.
- Reminders 4 days before the wish-list and gift deadlines.
- Year-end giving statements on January 15.

### About giving records and taxes
LIFT Ministries is not yet a 501(c)(3), so every receipt and statement currently says gifts are **not tax-deductible**. Once the IRS recognizes the ministry, set `ORG_TAX_EXEMPT=true` and `ORG_EIN` in Netlify. Receipts then switch to standard tax-receipt wording; nothing else changes.

## Run it locally

```bash
cp .env.example .env        # point DATABASE_URL/DIRECT_URL at a local Postgres
npm install
npx prisma migrate dev      # create tables
npm run db:seed             # optional demo data (5 angels)
npm run dev                 # http://localhost:3000, admin at /admin
```

Without `RESEND_API_KEY`, emails are printed to the server log.

## Deploy: Supabase + Netlify

1. **Supabase:** create a project. Copy the two connection strings (see `.env.example`) into `DATABASE_URL` and `DIRECT_URL`.
2. **Netlify:** "Add new site → Import from Git", choose this repo. `netlify.toml` already sets the build command, which runs the database migrations and then builds.
3. In **Netlify → Site configuration → Environment variables**, add everything from `.env.example`. Set `NEXT_PUBLIC_SITE_URL` to the site's real URL.
4. **Resend:** verify your sending domain, then set `RESEND_API_KEY` and `EMAIL_FROM`.
5. Deploy. The scheduled jobs in `netlify/functions/` are picked up automatically (daily reminders; giving statements in mid-January).
6. Sign in at `/admin`, open **Seasons & Deadlines**, create this year's season, and fill in the deadlines, Venmo username, Amazon list, shipping address, and drop-off/pickup details.

## Adding logos, photos, and testimonials

- **Logos:** save the angel as `public/brand/angel.png` (transparent background) and the full artwork as `public/brand/community-christmas.jpg`. A star shows until they're added.
- **Photos:** put them in `public/photos/` and set the paths in `src/content/site.ts`.
- **Testimonials and site wording:** edit `src/content/site.ts`.
- **Spanish text** for families: edit `src/content/i18n.ts`. Please have a native speaker review it before launch.
