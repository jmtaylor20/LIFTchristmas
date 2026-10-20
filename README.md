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

The Netlify project **lift-christmas** (https://lift-christmas.netlify.app) already exists, with `SESSION_SECRET`, `CRON_SECRET`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`, `ORG_LEGAL_NAME` and `ORG_TAX_EXEMPT` set. To finish:

1. **Supabase:** create a project named `lift-christmas` (region: East US). Save the database password it asks you to choose.
2. In Supabase, click **Connect** and copy two connection strings:
   - **Transaction pooler** (port 6543). Add `?pgbouncer=true&connection_limit=1` to the end. This is `DATABASE_URL`.
   - **Session pooler** (port 5432). This is `DIRECT_URL`.
   Put your password in place of `[YOUR-PASSWORD]` in both.
3. In **Netlify → lift-christmas → Project configuration → Environment variables**, add `DATABASE_URL` and `DIRECT_URL`. Also add `ADMIN_NOTIFY_EMAIL` (the owner's email) and, once Resend is set up, `RESEND_API_KEY` and `EMAIL_FROM`.
4. In **Netlify → Project configuration → Build & deploy → Link repository**, choose GitHub → `jmtaylor20/LIFTchristmas`. Set the production branch to the branch with this code (`main` once it's merged). Netlify builds automatically: `netlify.toml` runs the database migrations first, creating all the tables, then builds the site.
5. The scheduled jobs in `netlify/functions/` turn on automatically (daily reminders; giving statements in mid-January).
6. Sign in at `/admin`, open **Seasons & Deadlines**, create this year's season, and fill in the deadlines, Venmo username, Amazon list, shipping address, and drop-off/pickup details.

## Adding logos, photos, and testimonials

- **Artwork:** the original angel and Community Christmas images are in `public/brand/`, copied unchanged from the LIFT Christmas Google Drive folder. Following the brand kit, the site never crops them, recolors them, or puts text over them.
- **Photos:** put them in `public/photos/` and set the paths in `src/content/site.ts`.
- **Testimonials and site wording:** edit `src/content/site.ts`.
- **Spanish text** for families: edit `src/content/i18n.ts`. Please have a native speaker review it before launch.
