# LIFT Community Christmas

Website and ministry admin for **LIFT Ministries Community Christmas**, serving children in Reeltown & Tallassee, Alabama. LIFT stands for *Living In Faith Together*.

Contact: liftministriesal@gmail.com · (334) 328-1513 · [Facebook](https://www.facebook.com/LIFTMinistries)

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

**Three home-screen apps.** On a phone, each part of the site can be added to the home screen as its own app, with its own name and icon. A prompt explains how.
- **LIFT Giving** (`/account`): for givers.
- **LIFT Family** (`/family`): for parents. On a device that has opened the family's private link, it goes straight back to their page.
- **LIFT Admin** (`/admin`): for the ministry. On phones it has a bottom tab bar and a full menu, and its tables become cards.

**Sponsor recognition**
- **Business partners** (`/partners`): businesses give $100 or more and upload their logo. Once the owner approves the logo *and* marks the gift received, it appears on the home page partner wall by tier. Tiers follow the money received: **Gold** $1,000+, **Silver** $500+, **Bronze** $100+. The owner can also set a tier by hand.
- **Thank-you ticker:** a rotating list of givers runs across the home page. Only givers whose gifts the owner has confirmed appear, so nobody can put a name there just by filling out a form. Givers choose a display name (for example, "The Smith Family") or stay anonymous on every giving form and in their profile.

**Automatic thank-you emails** (each sent once):
- When a sponsor's gifts are all received.
- When an Amazon or drop-off gift is received.
- When a business partner's logo goes live.
- A Community Christmas thank-you to every giver of the season, sent automatically from December 27 with the season's real totals. The owner can preview it or send it early under Dashboard → Reminders.

**Ministry admin** (`/admin`):
- Dashboard: applications to review, angel coverage, money received, fund balance, the dollar value still needed, items waiting on you, and reminder buttons.
- Applications: approve, waitlist, or deny, with an email to the family in their language. **Each family can be approved at most 5 years**; the cap is adjustable per season and enforced on the server. To approve a family past the cap anyway, use **Override the cap** on their application. It needs the override password (`CAP_OVERRIDE_PASSWORD`, set in Netlify), and each override is recorded.
- Sign-in: after 8 wrong passwords from one address, sign-in locks for 15 minutes.
- Angels & Lists: each item's status (needed, committed, received, or "ministry buying" with the actual $ spent), how sponsors are delivering, tracking numbers, and adding sponsors by hand.
- Givers, with how many years each has sponsored. Family History across all years.
- Money & Gifts: confirm reported Venmo/check/cash gifts (this sends the receipt), record gifts directly, and track Amazon/drop-off gifts.
- Thank-You Notes: review and lightly edit a family's note before it's emailed to their sponsors.
- Giving Statements: preview, send, or resend year-end statements.
- Gift Tags: printable Angel Tree tags and pickup-day bag labels.
- Pickup Day: a phone-friendly check-off by last name, phone, or angel #.
- Business Partners: approve logos, edit names and websites, set tiers.
- Seasons & Deadlines: one season per year. A season with nothing in it yet can be deleted. It holds the deadlines, Venmo username, Amazon list, shipping address, drop-off and pickup details.

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

## Hosting (live)

- **Site:** https://lift-christmas.netlify.app (Netlify project `lift-christmas`, team jmtaylor20)
- **Database:** Supabase project `lift-christmas` (us-east-1)
  - The tables live in a private `lift` schema, owned by a dedicated `lift_app` login, so Supabase's public API can't reach them.
  - The site connects through the Supabase pooler at `aws-0-us-east-1.pooler.supabase.com`: `DATABASE_URL` on port 6543 for the app, `DIRECT_URL` on port 5432 for migrations.
- **Health check:** `/api/health` reports whether the site can reach the database.
- **Every deploy:** `netlify.toml` runs `prisma migrate deploy` first, so schema changes in `prisma/migrations` apply automatically.

Environment variables are set in **Netlify → Project configuration → Environment variables**. Still to add:
- `ADMIN_NOTIFY_EMAIL`: the owner's email, for alerts.
- `RESEND_API_KEY` and `EMAIL_FROM`: once a Resend account is set up. Until then, emails are only written to the function logs.

**Automatic deploys from GitHub:** in Netlify, open **Project configuration → Build & deploy → Continuous deployment → Link repository**. Choose GitHub → `jmtaylor20/LIFTchristmas` with production branch `main`. After that, every merge to `main` deploys on its own.

**First steps in the admin** (`/admin`): open **Seasons & Deadlines**, create this year's season, and fill in the deadlines, Venmo username, Amazon list, shipping address, and drop-off/pickup details.

## Adding logos, photos, and testimonials

- **Artwork:** the original angel and Community Christmas images are in `public/brand/`, copied unchanged from the LIFT Christmas Google Drive folder. Following the brand kit, the site never crops them, recolors them, or puts text over them.
- **Photos:** put them in `public/photos/` and set the paths in `src/content/site.ts`.
- **Testimonials and site wording:** edit `src/content/site.ts`.
- **Spanish text** for families: edit `src/content/i18n.ts`. Please have a native speaker review it before launch.
