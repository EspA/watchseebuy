# WatchSeeBuy

Watch. See. Buy.

Your companion for finding toys on eBay, for the exacting collector.  
Site: [watchseebuy.com](https://watchseebuy.com)

The first vertical is vintage toys and cards: Pokémon, LEGO, Hot Wheels, Labubu, Kenner Star Wars, Transformers, TMNT, Barbie, G.I. Joe, and He-Man.

- Product: [PRODUCT.md](PRODUCT.md)
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)

## What it does

Search is public. Classic search calls official eBay Browse. AI Mode is a catalog assistant (`GEMINI_API_KEY`) that turns a description of a toy into that same search. Signed-out visitors get 10 AI Mode searches. Free includes 100 a month. Premium and Premium+ are unlimited. Classic search still works when the assistant is unset.

Every result shows the price to the collector’s door, a confidence score, and a price score. Exclude words run after eBay returns its loose matches. A card grade is a minimum, not an exact match. Two collectors with the same keywords share one coverage query. Landed max and ship-to stay on the watch.

Saving a watch requires an account. Alerts are email: when a new match appears, a daily note, or a weekly recap at 8pm in the collector’s timezone. The site is English, German, French, Italian, Spanish, Dutch, and Polish.

Plans bill through PayPal (sandbox until `PAYPAL_ENV=live`). Free is the default: 10 watches, and trigger-on-change polls about once an hour. Premium is $4.99 a month: 100 watches, about every 15 minutes. Premium+ is $9.99 a month: 300 watches, about every 5 minutes. Annual is ten monthly payments. Cancelling in Settings keeps the paid plan until it expires. Admins can grant a complimentary plan from a user’s page.

`COMING_SOON=1` serves the tease on the public host. Leave it unset locally so search and watches stay available. `apps/coming-soon` is the separate static site.

## Repo

```
apps/web          Next.js (search, AI Mode, SSO, watches, plans)
apps/admin        Next.js operator console (Google SSO allowlist)
apps/worker       poll coverage queries, match, send alerts
apps/coming-soon  static tease (HTML)
packages/domain   watches, comps, landed cost, matcher, plans, assistant criteria
packages/ebay     official API client + EPN URLs
packages/db       Drizzle schema (Postgres)
packages/notify   alert email templates + SMTP send
```

## Local

```bash
cp .env.example apps/web/.env.local
cp .env.example apps/admin/.env.local
# set BETTER_AUTH_SECRET to a long random string

docker compose up -d
npm install
npm run db:push
npm run dev
```

- Web: http://localhost:3000
- Admin: http://localhost:3001 (`npm run dev:admin`) — Google only, `ADMIN_ALLOWED_EMAIL`
- Worker: starts with `npm run dev` (turbo) or `npm run dev:worker`
- Mailpit: http://localhost:8025 (SMTP `127.0.0.1:1025`)
- Tests: `npm test`

Search works without an account. Saving a watch requires sign-in.

Google, Facebook, and Apple buttons appear once those client IDs are in `.env.local`. Collectors can also use an email magic link or a password. Magic-link and alert mail go to Mailpit when `SMTP_HOST` is set. Without it, they log to the server console. In local, the sign-in page also shows the last magic-link URL.

eBay search stays empty until `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET` are set. Coverage-query keys are already computed on every search. AI Mode needs `GEMINI_API_KEY` (`GEMINI_MODEL` defaults to `gemini-3.5-flash-lite`).

Plans stay on Free until PayPal sandbox credentials are set. Point the `BILLING.SUBSCRIPTION.*` webhook at `{APP_URL}/api/billing/paypal/webhook`.

Production keys also need the Marketplace User Account Deletion endpoint. Set `EBAY_NOTIFICATION_VERIFICATION_TOKEN` (32–80 characters) and register `https://watchseebuy.com/api/ebay/account-deletion` in the eBay Developer Portal (Application Keys). Local: `GET http://localhost:3000/api/ebay/account-deletion?challenge_code=test`.

The Timeless Vault can call official eBay Browse through WatchSeeBuy at `/buy/browse/v1/*` with `Authorization: Bearer $PARTNER_BROWSE_TOKEN`. Unset the token to disable the proxy. Those calls count against this app’s eBay quota and show up in admin as source `partner_browse`.

Admin lists users, email, and eBay API calls for a UTC day, including failed-call detail.

## Auth callbacks

Point each provider at `http://localhost:3000/api/auth/callback/{google|facebook|apple}`. Production: `https://watchseebuy.com/api/auth/callback/...`.

Admin Google also needs `http://localhost:3001/api/auth/callback/google` and `https://admin.watchseebuy.com/api/auth/callback/google`.
