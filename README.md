# WaitSeeBuy

Wait. See. Buy.

The CamelCamelCamel of eBay — starting with **collectibles**.  
Site: [waitseebuy.com](https://waitseebuy.com)

- Product: [PRODUCT.md](PRODUCT.md)
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)

## Repo

```
apps/web          Next.js (public search, SSO, watches)
apps/admin        Next.js operator console (Google SSO allowlist)
apps/worker       poll coverage queries, match, send alerts
packages/domain   watches, comps, landed cost, matcher
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

Search works without an account. Saving a watch requires sign-in. Two collectors with the same keywords share one coverage query; landed max and ship-to stay on the watch.

Google / Facebook / Apple buttons appear once those client IDs are in `.env.local`. Magic-link and alert mail go to Mailpit when `SMTP_HOST` is set. Without it, they log to the server console. In local, the sign-in page also shows the last magic-link URL.

eBay search stays empty until `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET` are set. Coverage-query keys are already computed on every search.

Production keys also need the Marketplace User Account Deletion endpoint. Set `EBAY_NOTIFICATION_VERIFICATION_TOKEN` (32–80 characters) and register `https://waitseebuy.com/api/ebay/account-deletion` in the eBay Developer Portal (Application Keys). Local: `GET http://localhost:3000/api/ebay/account-deletion?challenge_code=test`.

The Timeless Vault can call official eBay Browse through WaitSeeBuy at `/buy/browse/v1/*` with `Authorization: Bearer $PARTNER_BROWSE_TOKEN`. Unset the token to disable the proxy. Those calls count against this app’s eBay quota and show up in admin as source `partner_browse`.

## Auth callbacks

Point each provider at `http://localhost:3000/api/auth/callback/{google|facebook|apple}`. Production: `https://waitseebuy.com/api/auth/callback/...`.

Admin Google also needs `http://localhost:3001/api/auth/callback/google` and `https://admin.waitseebuy.com/api/auth/callback/google`.
