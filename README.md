# WaitSeeBuy

Wait. See. Buy.

The CamelCamelCamel of eBay — starting with **collectibles**.  
Site: [waitseebuy.com](https://waitseebuy.com)

- Product: [PRODUCT.md](PRODUCT.md)
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)

## Repo

```
apps/web          Next.js (public search, SSO, watches)
apps/worker       coverage-query poll loop
packages/domain   watches, comps, landed cost, matcher
packages/ebay     official API client + EPN URLs
packages/db       Drizzle schema (Postgres)
```

## Local

```bash
cp .env.example apps/web/.env.local
# set BETTER_AUTH_SECRET to a long random string

docker compose up -d
npm install
npm run db:push
npm run dev
```

- Web: http://localhost:3000
- Worker: starts with `npm run dev` (turbo) or `npm run dev:worker`

Search works without an account. Saving a watch requires sign-in. Two collectors with the same keywords share one coverage query; landed max and ship-to stay on the watch.

Google / Facebook / Apple buttons appear once those client IDs are in `.env.local`. Magic-link emails log to the web server console until `RESEND_API_KEY` is set. In local, the sign-in page also shows the last magic-link URL.

eBay search stays empty until `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET` are set. Coverage-query keys are already computed on every search.

## Auth callbacks

Point each provider at `http://localhost:3000/api/auth/callback/{google|facebook|apple}`. Production: `https://waitseebuy.com/api/auth/callback/...`.
