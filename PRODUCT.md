# WaitSeeBuy — product thesis

**Domain:** [waitseebuy.com](https://waitseebuy.com)  
**Job:** Become the CamelCamelCamel of eBay — for the exacting collector who already knows the piece, sees whether the price to their door is worth it, then buys.

Wait. See. Buy.

This is not a faster eBay. It is not a flipper radar. Search acquires. **Watches earn.** We curate for collectors.

---

## Who it is for

**The exacting collector.** They already know the piece — the PSA 10, the factory-sealed set, the carded figure — and they are tired of eBay’s keyword noise and “cheap” listings that are expensive once shipping lands.

They will wait weeks. They will not sit on Telegram. They share the piece and the precise criteria, then want a watch they can trust, on a schedule they choose.

**Not for:** resellers chasing 15-second underpriced lots, snipers, or anyone whose job is “source inventory across six marketplaces.”

---

## First vertical: vintage toys and cards

The public wedge is the lines that actually move on eBay, not a generic “collectibles” aisle.

**Launch lines:** Pokémon, LEGO, Hot Wheels, Labubu, Kenner Star Wars, Transformers, TMNT, Barbie, G.I. Joe, He-Man.

Why this wedge:

- Sold comps are the product. Collectors already think in “what did the last one go for?”
- Condition language is the product. eBay search is bad at it (PSA 10 vs raw, factory-sealed vs opened, carded vs loose, punched vs unpunched, complete accessories).
- Higher AOV than casual retail, and these lines are among the stronger eBay Partner Network categories.
- Passionate, repeat watchers. One good watch can last months.

Homepage, examples, and alert copy should sound like a collector: name the condition, not a category list. Comics, coins, stamps, sports cards, and other memorabilia use the same watch engine later. Do not put them on the homepage while the first vertical is this wedge.

---

## How we sound

- Kicker: **For the exacting collector.** Not “for people who will wait,” not “picky,” not “experienced.”
- Hero objects: **the PSA 10, the factory-sealed set, the carded figure.** Not “a card, a figure, a comic.”
- Public copy says **price to your door.** “Landed cost” is the internal name (item + shipping + a simple import/tax guess). Do not lead with “landed” on a first-read surface; define it where the numbers appear.
- We **watch with you** and tell you when that price is worth buying. Not “market insights.” Not “your opportunity.”
- Buy is curated for collectors. We are not a faster marketplace.

---

## What we will build first

1. **Simple search, no account required** — official eBay APIs, quick and obvious, enough to find a piece and see whether the price is fair. Every result shows a **confidence score**, a **price score**, and the **price to your door**. Nothing hidden. Sign-in is not the front door. Not a redesign of eBay browse.
2. **Intent watches** — the collector shares the piece and the precise criteria. Stored as meaning, not a raw saved search. Example: “PSA 10 Base Set Charizard, no reprints, under $X to my door, US or ships to me, not auction unless under Y.”
3. **Price to your door as the number** — max price includes shipping and a simple import/tax estimate to the user’s address. Location is first-class.
4. **Sold-comp context on every result and every alert** — condition-matched, “this is 18% below the 90-day sold median.” That is why people click, and why EPN converts. Price score is that judgment made visible.
5. **Alerts on their schedule** — email first, then push. The collector chooses the cadence: **when a new listing appears**, a **daily note**, or a **weekly recap**. Instant is not the default; volume is not the goal.
6. **EPN-approved outbound buy** — one-tap from the alert, campaign IDs that can be re-attached. Design for a short cookie. In-app checkout (Buy APIs) is later, not v1. We curate what we send them to; we do not make eBay faster.

Web first. Mobile is a notification surface after people already trust the watches.

Until launch, waitseebuy.com is a static tease. Product routes stay off the public chrome.

---

## Who can do what without an account

**Anyone can search and see comps, scores, and the price to their door.** That is how CamelCamelCamel works, and it is how we acquire. A collector should paste a piece, see the all-in price vs sold median, and decide — no email wall.

**Saving a watch and getting alerts requires an account.** Sign in with **Google, Facebook, or Apple**. Keep an email magic link as a fallback so someone is never stuck if a provider is down or they do not want social login. That account is the “wait” half of the product, and it is the only thing that creates standing eBay poll load.

Price to your door without a profile: optional ship-to (ZIP / country) on the search itself, remembered in the browser. Do not force a signup to type a postcode.

Protect quota without a login: cache search and comps aggressively, rate-limit by IP, and put the signup gate on **Watch this** — not on the search box.

---

## What we will not build (v1)

- A speed war with Lotify / eFerret Pro / Telegram bots
- Auction sniping
- Multi-marketplace reseller suites (Facebook, Craigslist, Mercari)
- Scrapers — official eBay Developers Program + Browse/Feed APIs only
- Anything that looks like eBay: no “eBuy”, no “Bay” in the brand, no confusing similarity
- Generic “all of eBay, but simpler” as the homepage
- A sourcing-tool voice: no “market insights,” no “opportunity,” no flipper radar
- Paid walls in front of basic watches — consumer core stays free; EPN is the default revenue

---

## How we get paid

eBay Partner Network, as an **approved software application**. Disclose the relationship. Do not buy the word “eBay” in ads.

Assume a short attribution window. If the user opens a listing two days later from memory, we often earn nothing. The alert itself has to be the click.

**Ad blockers.** Many lists block legacy EPN hosts (for example `rover.ebay.com`) and strip affiliate query params. Buy now lands on the eBay item URL, so the listing should still open; we may not get paid if params are stripped. Do not fight the blocker and do not cloak links.

- Detect with a quiet client-side probe of the EPN host we actually use (image / fetch fail).
- If blocked, show a dismissible banner — not a modal wall, not a guilt trip. Copy: the listing may not open; allow this site or use the direct eBay button. Mention that those links fund the free product only if it stays one sentence.
- Buy must still work: fall back to a plain `ebay.com/itm/…` URL so the collector is never stuck.
- Email alerts use a first-party WaitSeeBuy click URL. That hop can show the same banner and the same fallback if the EPN redirect would be blocked.
- Never invent workarounds to hide affiliate URLs from filters. That risks EPN and trust.

---

## Success looks like

A collector sets three watches, picks a cadence, leaves the site, and comes back because an alert was *right* — fair price to their door, right condition, not junk. They buy from that alert.

If we are competing on “seconds after list,” we have already lost.
