import { plainItemUrl } from "@waitseebuy/ebay";
import { NextResponse } from "next/server";

/** First-party click hop. Looks up the token and 302s to EPN, or a plain item URL. */
export async function GET() {
  return NextResponse.redirect(plainItemUrl("0"), { status: 302 });
}
