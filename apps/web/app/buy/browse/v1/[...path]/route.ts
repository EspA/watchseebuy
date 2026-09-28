import {
  authorizePartnerBrowse,
  createEbayClientFromEnv,
  ebayBrowseError,
  partnerBrowseOriginFromEnv,
  partnerBrowsePath,
  pickUpstreamBrowseHeaders,
  rewriteBrowseHrefs,
} from "@watchseebuy/ebay";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ALLOWED_METHODS = new Set(["GET", "POST"]);

async function handle(
  request: Request,
  params: Promise<{ path: string[] }>,
) {
  if (!ALLOWED_METHODS.has(request.method)) {
    return NextResponse.json(
      ebayBrowseError(
        2004,
        "REQUEST",
        "Method not allowed.",
        "This partner Browse proxy accepts GET and POST, matching eBay Browse.",
      ),
      { status: 405, headers: { Allow: "GET, POST" } },
    );
  }

  const auth = authorizePartnerBrowse(request.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }

  const { path } = await params;
  const pathname = partnerBrowsePath(path);
  if (!pathname) {
    return NextResponse.json(
      ebayBrowseError(
        11001,
        "REQUEST",
        "The specified resource is not found.",
        "The Browse path is missing or invalid.",
      ),
      { status: 404 },
    );
  }

  const ebay = createEbayClientFromEnv("partner_browse");
  if (!ebay.isConfigured()) {
    return NextResponse.json(
      ebayBrowseError(
        2003,
        "APPLICATION",
        "eBay API credentials are not set.",
        "Set EBAY_CLIENT_ID and EBAY_CLIENT_SECRET on WatchSeeBuy.",
      ),
      { status: 503 },
    );
  }

  const incoming = new URL(request.url);
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? null
      : await request.text();

  try {
    const upstream = await ebay.proxyBrowse({
      method: request.method,
      pathname,
      search: incoming.search,
      headers: request.headers,
      ...(body ? { body } : {}),
    });
    const rewritten = rewriteBrowseHrefs(
      upstream.body,
      partnerBrowseOriginFromEnv(),
    );
    console.info(
      JSON.stringify({
        at: new Date().toISOString(),
        message: "partner_browse_proxy",
        path: pathname,
        status: upstream.status,
      }),
    );
    return new NextResponse(rewritten, {
      status: upstream.status,
      headers: pickUpstreamBrowseHeaders(upstream.headers),
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        at: new Date().toISOString(),
        message: "partner_browse_proxy_failed",
        path: pathname,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return NextResponse.json(
      ebayBrowseError(
        2001,
        "SYSTEM",
        "A system error has occurred.",
        "Could not reach the eBay Browse API.",
      ),
      { status: 502 },
    );
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return handle(request, context.params);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return handle(request, context.params);
}
