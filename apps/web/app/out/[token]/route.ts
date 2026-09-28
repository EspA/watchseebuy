import { ebaySiteHost } from "@watchseebuy/domain";
import { getAlertClick, getDb } from "@watchseebuy/db";
import { epnConfigFromEnv, epnItemUrl, plainItemUrl } from "@watchseebuy/ebay";
import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/absolute-url";
import { clientMeta, persistUserEvent } from "@/lib/client-meta";
import { getSession } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const click = await getAlertClick(getDb(), token);
  if (!click) {
    return NextResponse.redirect(absoluteUrl("/", request), 302);
  }

  const session = await getSession();
  const meta = clientMeta(request.headers);
  await persistUserEvent({
    kind: "buy_click",
    userId: click.userId ?? session?.user.id ?? null,
    ip: meta.ip,
    meta: {
      source: "alert",
      itemId: click.ebayItemId,
      token,
    },
  });

  const payload =
    click.payload && typeof click.payload === "object"
      ? (click.payload as {
          webUrl?: string;
          ebaySite?: string;
        })
      : {};
  const host = ebaySiteHost(payload.ebaySite);
  const fallback = payload.webUrl ?? plainItemUrl(click.ebayItemId, host);
  const href =
    epnItemUrl({
      itemId: click.ebayItemId,
      site: host,
      customId: token,
      ...epnConfigFromEnv("alert"),
    }) ?? fallback;

  return NextResponse.redirect(href, 302);
}
