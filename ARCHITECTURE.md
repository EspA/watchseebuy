# WatchSeeBuy — architecture

Decisions for a product that may become highly used, without paying microservice tax on day one.

The hard problem is not HTTP. It is **eBay API quota** plus **matching many watches to each new listing without polling once per user**. If we get that data model right now, we can stay small for a long time and still scale.

---

## The call

| Choice | Decision |
|---|---|
| Shape | Modular monolith, one repo, Cloud Run services `web`, `worker`, and `admin` |
| Language | TypeScript end to end |
| Web | Next.js (App Router) |
| Worker | Same repo, same language — a long-running Cloud Run service (or Cloud Run job on a schedule at first) |
| Data | Cloud SQL Postgres |
| Cache / locks | Memorystore Redis — add as soon as we send real alerts (idempotency) |
| Jobs | Cloud Scheduler → worker. Pub/Sub + Cloud Tasks when fan-out needs it |
| Host | GCP, single region first (`us-east1` unless users are clearly elsewhere) |
| Auth | SSO: Google, Facebook, Apple. Sessions in Postgres (Better Auth). Keep email magic link as a fallback. |
| Email | SMTP. Auth and alerts share the same sender. Local: Mailpit. Production: any SMTP you control. |
| eBay | Official Browse / Feed APIs only, one shared client, one quota budget |

**Not now:** GKE, a service mesh, a microservice per noun, Firebase as the system of record, scraping.

Microservices become useful when the watch matcher, the website, and notifications have *different* scale and failure domains — and we have traffic to prove it. Until then, modules in one repo. Splitting a well-bounded worker off Cloud Run is a deploy change, not a rewrite.

---

## Why not microservices yet

You already know the pattern. It is the right *end state* for a high-traffic watch engine, the wrong *start state*.

What would actually break first under load:

1. eBay rate limits (shared, political, not solved by more services)
2. Duplicate alerts (product-killing)
3. N+1 polling: 10,000 watches × one search each
4. Cloud SQL connections from too many Cloud Run instances

More processes make (1) and (4) worse. The fix for (3) is **coalesced coverage queries**, which is a schema and matcher design, not a fleet of services.

When we *do* split, the cuts are obvious: `web` (user traffic), `worker` (poll + match), later `notify` (email/push). Same repo. Same types.

---

## Why TypeScript

The product is HTTP JSON (eBay, EPN, email), a web UI, and structured watch criteria. One language means the watch AST, landed-cost math, and comp types are shared — not re-specified in OpenAPI between a Go worker and a React app on week two.

If the matcher ever becomes CPU-bound at huge listing volume, rewrite *that module* in Go. Do not start there. Quota will bite first.

---

## How the system works

```
Collector
   │
   ▼
 Cloud Load Balancing  →  Cloud Run: web (Next.js)
                               │
 Operator  →  admin.watchseebuy.com  →  Cloud Run: admin
                               │
                               ├── Postgres (users, watches, comps cache, alerts,
                               │            ebay_api_calls, email_sends, user_events)
                               └── Redis (seen listings, alert locks, quota tokens)
                               │
                               ▼  (creates / updates)
                          coverage queries
                               │
Cloud Scheduler ──► Cloud Run: worker
                               │
                               ├── poll eBay once per stale coverage query
                               ├── match listings → watches (in process)
                               ├── write listings + matches
                               └── send due emails (on change, or 8pm digest)
                               │
                               ▼
                          SMTP (Mailpit locally; your MTA in production)
                               │
                               ▼
                          first-party /out/{token}  →  EPN (or plain item URL)
```

Search in the browser hits eBay through **our** API so we attach EPN IDs, compute landed cost, and attach comps. The user never talks to eBay’s API directly. Search is **public** (rate-limited and cached). Auth is required only to persist a watch.

**Partner Browse proxy.** `GET/POST /buy/browse/v1/*` on `web` is a token-gated pass-through of the official eBay Browse contract (same path, query, headers, and JSON). The only caller today is The Timeless Vault admin (`admin.thetimelessvault.com`). `Authorization: Bearer` must match `PARTNER_BROWSE_TOKEN` (Secret Manager, 32+ characters). WatchSeeBuy swaps in its own application token and records the call as source `partner_browse`. Browse `itemHref` / `href` / `next` URLs are rewritten onto `APP_URL` so follow-up getItem calls stay on this host; public `itemWebUrl` is not rewritten. These calls share the same eBay quota as search and the worker.

---

## The scale design to implement on day one

Even with 50 users, store watches as if we will have 50,000.

**Coverage query.** A watch does not own an eBay poll. We compile structured criteria into a coarser eBay search (keywords, category, condition class, site). Many watches share one coverage query. The worker polls those, then filters in-process.

**Seen listings.** `(ebay_item_id)` is unique. We never alert twice for the same watch + item. Postgres unique `(watch_id, ebay_item_id)` is the source of truth. Redis locks come later under load.

**Match, then decide when to send.** A match can exist without an alert until the watch cadence says so. On-change sends as soon as a new match is written. Daily and weekly hold unsent matches and send one email at **8pm local** (weekly on Sunday). `last_alerted_at` is the digest watermark. Price score and seller score are shown on the result; they do not gate send.

**Normalized item key for comps.** Collectibles need a key like `psa|1986-fleer-jordan|10`, not the eBay title string. Comp cache lives in Postgres first. BigQuery is a later warehouse, not the serving path.

**One eBay client.** Token refresh, quota budget, backoff, and caching in a single module. Every new feature that wants “just one more search” goes through it.

---

## Logical modules (one process until they are not)

| Module | Responsibility |
|---|---|
| `web` | Pages, auth, search UX, watch CRUD |
| `admin` | Operator console on admin.watchseebuy.com; Google SSO allowlist |
| `ebay` | Official API client, quota, EPN URL builder |
| `watches` | Intent → structured criteria → coverage query |
| `comps` | Sold stats, condition matching, “% vs median” |
| `pricing` | Landed cost (item + shipping + simple duty/tax) |
| `matcher` | Listing vs watches for a coverage query |
| `notify` | Alert email HTML/text, subjects by cadence, SMTP send, click-token listings |

These are packages, not repos.

Repo layout:

```
apps/web          Next.js (public search, SSO, watches)
apps/admin        Next.js operator console (port 3001 locally)
apps/worker       poll / match / send
packages/domain   watches, comps, pricing, matcher, digest clock
packages/ebay     API + EPN
packages/db       Postgres schema + queries
packages/notify   email templates + send
```

---

## GCP map

**Day one (cheap, enough):**

- Cloud Run for `web` (scale to zero in staging)
- Cloud Run for `admin` (separate hostname, scale to zero)
- Cloud Run for `worker` (min instances 0–1; 1 once watches are live)
- Cloud SQL Postgres (small HA later, not now)
- Secret Manager (eBay, EPN, auth, mail)
- Cloud Scheduler (worker tick)
- Artifact Registry + Cloud Build or GitHub Actions
- Cloud Logging / Error Reporting
- Cloud DNS for `watchseebuy.com` (domain is at GoDaddy; point NS or A/AAAA here). Keep `waitseebuy.com` mapped and 301 to the new host.

**Add under real load, in this order:**

1. Memorystore Redis — alert locks and listing-seen hot path
2. Cloud Tasks — alert fan-out so a mail blip does not block polling
3. Pub/Sub — multiple worker consumers, back-pressure
4. Cloud Armor + Cloud CDN — public web
5. Read replica / connection pooler (AlloyDB is optional; Postgres + a pooler is enough for a long time)
6. BigQuery — analytical comps, not user-facing

**Skip unless we have a reason:** GKE, Cloud Functions for the core loop (cold starts + fan-out mess), Firestore as primary data, a second region.

---

## Data to lock early

```
users                email, name, first/last, timezone, ship_to, theme,
                     last_login_at, last_ip, last_country, login_count
watches              structured criteria, user_id, coverage_query_id,
                     alert_frequency (on_change | daily | weekly), last_alerted_at
coverage_queries     the eBay searches we actually poll (last_polled_at)
listings             ebay item id, payload snapshot, first_seen
matches              watch_id + listing_id, landed_price, comp_delta, unique(watch, listing)
alerts               match_id, channel, sent_at, click_token
sold_comp_cache      item_key, window, median, sample_size, fetched_at
ebay_api_calls       api, source, ok, http_status, duration_ms, error
                     (raw rows + error bodies kept 60 days; daily counts kept)
email_sends          kind, status (delivered | failed | logged_only), error
user_events          kind (search | buy_click), user_id, ip, meta.mode
                     (classic | agent). Signed-out events use user
                     `unauthenticated`. Purged after 60 days.
```

Indexes on `coverage_query_id`, `ebay_item_id`, and `click_token`. That is the backbone.

---

## What “highly used” means here

A popular collectibles watch app is **write- and poll-heavy**, not a classic request-per-page problem.

| Scale | What we do |
|---|---|
| Now | One region, one Postgres, scheduler + worker, coalesce from day one |
| Busy | Redis locks, Cloud Tasks for mail, worker min instances = 1 |
| Large | Split notify, more coverage-query shards, tighter eBay cache, maybe a Go matcher |
| Huge | Multi-region web, single-region worker next to eBay-relevant data, BigQuery comps |

We do not need Kubernetes to walk that path.

---

## eBay quota (request an increase as soon as we are live)

Default production keys are small (often on the order of thousands of calls per day until eBay reviews the app). We will file an **Application Growth Check / limit increase** the moment `watchseebuy.com` is in production — not after we start dropping alerts.

eBay does not raise limits because we waited. They raise them when they see a real app, a real App ID, and a number that is justified.

The request should include:

- Production App ID and the live URL
- APIs we actually call (Browse / Feed, not a kitchen sink)
- Current average and peak calls/day, plus the day we first hit the ceiling
- A formula, not a vibe: `coverage_queries × polls/day × (1 + search/comp overhead) × buffer`
- What we do to stay polite: coverage-query coalescing, sold-comp cache, single client, backoff, no per-user polling

That is why coalescing is in the schema on day one. The increase is easier to get — and lasts longer — if we are not burning one search per watch.

Instrument from the first deploy: calls per API per day, cache hit rate, 429s, unique coverage queries vs watches. Those numbers *are* the application.

EPN software-application approval is a separate gate from developer API quota. File both. One does not replace the other.

---

## Security and EPN (non-optional)

- Software-application approval before production traffic to eBay
- Secrets only in Secret Manager; never in the Next.js client
- EPN campaign / custom IDs minted server-side on alert click (short cookie)
- Disclose affiliate relationship in the UI
- Outbound buy always goes through a first-party WatchSeeBuy click URL (`/go/buy` from search, `/out/{token}` from alerts), then 302 to the eBay item URL with EPN query params (`campid`, `mkrid`, …). Client probes `rover.ebay.com` as a blocker heuristic; if filters are on, the UI offers a plain item URL. Do not cloak affiliate params to evade filters.
- No “eBay” or “Bay” in hostnames or brand
- Least-privilege service accounts per Cloud Run service
- **Marketplace user account deletion.** Production eBay keys require a public HTTPS endpoint eBay can challenge and then notify. `GET/POST /api/ebay/account-deletion` on `web`. GET answers the SHA-256 challenge (`challengeCode + verificationToken + exact endpoint URL`). POST verifies `X-EBAY-SIGNATURE` via Notification API `getPublicKey`, then strips that seller’s username from cached listing snapshots. Token in Secret Manager (`EBAY_NOTIFICATION_VERIFICATION_TOKEN`); public URL in `EBAY_NOTIFICATION_ENDPOINT` or derived from `APP_URL`.
- **Partner Browse proxy.** `PARTNER_BROWSE_TOKEN` in Secret Manager. Unset disables the endpoint (503). Admin → eBay API shows `partner_browse` separately from `web_search` / `worker_poll` so the Application Growth Check can tell first-party traffic from The Timeless Vault.

---

## Auth (SSO)

Sign-in is **Google, Facebook, and Apple**, plus an email magic link so we are not hostage to one provider review.

Use **Better Auth** against Postgres (same `users` table). Secrets in Secret Manager. Callbacks on `watchseebuy.com`.

Launch prerequisites the providers will demand:

- Live privacy policy and terms (Facebook App Review will not ship without them)
- Apple: Services ID, key, and “hide my email” relay — store the Apple private relay address as the account email; never require a real inbox they did not give us
- Facebook: Meta app in Live mode; expect review delay. Do not block launch if Facebook is still in review — Google + Apple + magic link are enough
- Apple on the web now means we already satisfy App Store 4.8 when mobile ships (if any other third-party login is present, Apple must be too)

Link accounts by verified email when a collector uses two providers. Do not silently merge on name.

**Admin** is a separate Next.js app (`apps/admin`) on `https://admin.watchseebuy.com` (local port 3001). Its own Better Auth instance uses a distinct cookie prefix (`admin`) and Google only. `ADMIN_ALLOWED_EMAIL` (default `contact@watchseebuy.com`) is checked before user-create and session-create. Consumer logins increment `login_count`; admin sessions do not. A different port is a local convenience so cookies do not collide — production isolation is the hostname plus the allowlist. Cloud IAP can sit in front later.

---

## Alerts (what ships now)

The worker tick (default every 60s) does two jobs:

1. **Poll.** Coverage queries with at least one watch, whose `last_polled_at` is older than `COVERAGE_POLL_MS` (default 60 minutes), are searched once through the shared eBay client. Listings are hydrated, price-scored, upserted, then matched in-process to each watch on that query.
2. **Send.** Unsent matches become one email per watch. Cadence:
   - `on_change` — send as soon as a new match exists (**Potential new deal**)
   - `daily` — next 8pm in the user’s IANA timezone
   - `weekly` — Sunday 8pm local

The email uses the search-page listing card (price to your door, sold-comp line, scores, **Buy on eBay**). **Open the watch** and **Stop this watch** land on the app (stop requires sign-in). Buy goes to `/out/{click_token}`, which 302s to EPN or a plain item URL.

Without `SMTP_HOST`, the worker logs the email. `APP_URL` / `BETTER_AUTH_URL` mint absolute links. Local Mailpit is `127.0.0.1:1025` (UI on `:8025`). Production points the same vars at Postal, docker-mailserver, SES SMTP, or any other relay — the app does not lock an ESP.

---

## Local development

Docker Compose: Postgres + Redis + Mailpit. Next.js and the worker run on the host (`npm run dev` or `dev:web` / `dev:worker` / `dev:admin`). Same schema, same modules. No emulator zoo. After schema changes, `npm run db:push`. Open http://localhost:8025 to read captured mail. Admin is http://localhost:3001.

---

## Deliberately deferred

- In-app checkout (eBay Order API)
- Native mobile (the worker and notify path must be good first)
- Multi-marketplace
- Sub-minute polling as a product promise
