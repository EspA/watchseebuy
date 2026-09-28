import { ebaySiteHost, parseEbaySite } from "@watchseebuy/domain";
import { epnConfigFromEnv, epnItemUrl, plainItemUrl } from "@watchseebuy/ebay";
import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/absolute-url";
import { clientMeta, persistUserEvent } from "@/lib/client-meta";
import { getSession } from "@/lib/session";

const ITEM_ID = /^[\w.|-]{1,80}$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const itemId = url.searchParams.get("item")?.trim() ?? "";
  if (!ITEM_ID.test(itemId)) {
    return NextResponse.redirect(absoluteUrl("/search", request), 302);
  }

  const site = parseEbaySite(url.searchParams.get("site") ?? undefined);
  const host = ebaySiteHost(site);
  const session = await getSession();
  const meta = clientMeta(request.headers);
  await persistUserEvent({
    kind: "buy_click",
    userId: session?.user.id ?? null,
    ip: meta.ip,
    meta: {
      source: "search",
      itemId,
      ...(site ? { site } : {}),
    },
  });

  const fallback = plainItemUrl(itemId, host);
  const href =
    epnItemUrl({
      itemId,
      site: host,
      customId: session?.user.id ? `search:${session.user.id}` : "search",
      ...epnConfigFromEnv("search"),
    }) ?? fallback;

  return NextResponse.redirect(href, 302);
}
