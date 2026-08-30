# WaitSeeBuy — product thesis

**Domain:** [waitseebuy.com](https://waitseebuy.com)  
**Job:** Become the CamelCamelCamel of eBay — for people who will wait for the right piece, see whether the price is fair, then buy.

Wait. See. Buy.

This is not a faster eBay. It is not a flipper radar. Search acquires. **Watches earn.**

---

## Who it is for

A collector or everyday buyer who already knows what they want — a card, a figure, a comic, Lego toys, a coin — and is tired of eBay’s daily digest, keyword noise, and “cheap” listings that are expensive once shipping lands.

They will wait weeks. They will not sit on Telegram. They want one quiet, trustworthy watch.

**Not for:** resellers chasing 15-second underpriced lots, snipers, or anyone whose job is “source inventory across six marketplaces.”

---

## First vertical: collectibles

Cards, Lego, vintage toys, comics, coins, stamps, memorabilia.

Why this wedge:

- Sold comps are the product. Collectors already think in “what did the last one go for?”
- Condition language is brutal and eBay search is bad at it (graded vs raw, PSA/BGS, reprint, restoration, “for parts”).
- Higher AOV than casual retail, and collectibles is one of the stronger eBay Partner Network categories.
- Passionate, repeat watchers. One good watch can last months.

Homepage, examples, and alert copy should sound like a collector, not a sourcing tool. Other categories come later, using the same watch engine.

---

## What we will build first

1. **Simple search, no account required** — official eBay APIs, enough to find a piece and see whether the price is fair. Sign-in is not the front door. Not a redesign of eBay browse.
2. **Intent watches** — stored as meaning, not a raw saved search. Example: “PSA 10 1986 Fleer Jordan, under $X landed, US or ships to me, not auction unless under Y, no reprints.”
3. **Landed cost as the number** — max price includes shipping and a simple import/tax estimate to the user’s address. Location is first-class.
4. **Sold-comp context on every result and every alert** — condition-matched, “this is 18% below the 90-day sold median.” That is why people click, and why EPN converts.
5. **Quiet alerts** — email first, then push. Instant only when it is actually a deal. Quiet hours, exclude junk, seller-risk floor.
6. **EPN-approved outbound buy** — one-tap from the alert, campaign IDs that can be re-attached. Design for a short cookie. In-app checkout (Buy APIs) is later, not v1.

Web first. Mobile is a notification surface after people already trust the watches.

---

## Who can do what without an account

**Anyone can search and see comps.** That is how CamelCamelCamel works, and it is how we acquire. A collector should paste a card name, see landed price vs sold median, and decide — no email wall.

**Saving a watch and getting alerts requires an account.** Sign in with **Google, Facebook, or Apple**. Keep an email magic link as a fallback so someone is never stuck if a provider is down or they do not want social login. That account is the “wait” half of the product, and it is the only thing that creates standing eBay poll load.

Landed cost without a profile: optional ship-to (ZIP / country) on the search itself, remembered in the browser. Do not force a signup to type a postcode.

Protect quota without a login: cache search and comps aggressively, rate-limit by IP, and put the signup gate on **Watch this** — not on the search box.

---

## What we will not build (v1)

- A speed war with Lotify / eFerret Pro / Telegram bots
- Auction sniping
- Multi-marketplace reseller suites (Facebook, Craigslist, Mercari)
- Scrapers — official eBay Developers Program + Browse/Feed APIs only
- Anything that looks like eBay: no “eBuy”, no “Bay” in the brand, no confusing similarity
- Generic “all of eBay, but simpler” as the homepage
- Paid walls in front of basic watches — consumer core stays free; EPN is the default revenue

---

## How we get paid

eBay Partner Network, as an **approved software application**. Disclose the relationship. Do not buy the word “eBay” in ads.

Assume a short attribution window. If the user opens a listing two days later from memory, we often earn nothing. The alert itself has to be the click.

**Ad blockers.** Many lists block EPN hosts (for example `rover.ebay.com`) and strip affiliate query params. That can do two things: we do not get paid, and the Buy button can fail to open. Do not fight the blocker and do not cloak links.

- Detect with a quiet client-side probe of the EPN host we actually use (image / fetch fail).
- If blocked, show a dismissible banner — not a modal wall, not a guilt trip. Copy: the listing may not open; allow this site or use the direct eBay button. Mention that those links fund the free product only if it stays one sentence.
- Buy must still work: fall back to a plain `ebay.com/itm/…` URL so the collector is never stuck.
- Email alerts use a first-party WaitSeeBuy click URL. That hop can show the same banner and the same fallback if the EPN redirect would be blocked.
- Never invent workarounds to hide affiliate URLs from filters. That risks EPN and trust.

---

## Success looks like

A collector sets three watches, leaves the site, and comes back because an alert was *right* — fair landed price, right condition, not junk. They buy from that alert.

If we are competing on “seconds after list,” we have already lost.
