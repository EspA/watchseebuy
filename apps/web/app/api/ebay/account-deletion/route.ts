import { getDb, processEbayAccountDeletion } from "@watchseebuy/db";
import {
  challengeResponse,
  createEbayClientFromEnv,
  notificationEndpointFromEnv,
  parseAccountDeletionPayload,
} from "@watchseebuy/ebay";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const challengeCode = new URL(request.url).searchParams
    .get("challenge_code")
    ?.trim();
  if (!challengeCode) {
    return NextResponse.json(
      { error: "Missing challenge_code." },
      { status: 400 },
    );
  }

  try {
    const config = notificationEndpointFromEnv();
    return NextResponse.json({
      challengeResponse: challengeResponse(
        challengeCode,
        config.verificationToken,
        config.endpoint,
      ),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Endpoint is not configured." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const ebay = createEbayClientFromEnv("account_deletion");
  let verified = false;
  try {
    verified = await ebay.verifyAccountDeletionSignature(
      rawBody,
      request.headers.get("x-ebay-signature"),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        at: new Date().toISOString(),
        message: "ebay_account_deletion_signature_error",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return new NextResponse(null, { status: 412 });
  }
  if (!verified) {
    return new NextResponse(null, { status: 412 });
  }

  let event;
  try {
    event = parseAccountDeletionPayload(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Unrecognized notification payload." },
      { status: 400 },
    );
  }

  try {
    const result = await processEbayAccountDeletion(getDb(), event);
    console.info(
      JSON.stringify({
        at: new Date().toISOString(),
        message: "ebay_account_deletion_processed",
        notificationId: event.notificationId,
        listingsRedacted: result.listingsRedacted,
        duplicate: result.duplicate,
      }),
    );
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(
      JSON.stringify({
        at: new Date().toISOString(),
        message: "ebay_account_deletion_failed",
        notificationId: event.notificationId,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return new NextResponse(null, { status: 500 });
  }
}
