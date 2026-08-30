import { toCoverageQuery } from "@waitseebuy/domain";
import { getDb, saveWatch } from "@waitseebuy/db";
import { NextResponse } from "next/server";
import { intentFromSearchQuery } from "@/lib/search-params";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", "/search");
    return NextResponse.redirect(signIn, 303);
  }

  const form = await request.formData();
  const q = String(form.get("q") ?? "").trim();
  if (!q) {
    return NextResponse.redirect(new URL("/search?error=empty", request.url), 303);
  }

  const intent = intentFromSearchQuery({
    q,
    min: String(form.get("min") ?? form.get("minPrice") ?? ""),
    max: String(form.get("max") ?? form.get("maxPrice") ?? ""),
    zip: String(form.get("zip") ?? form.get("shipToPostal") ?? ""),
    condition: String(form.get("condition") ?? ""),
    located: String(form.get("located") ?? ""),
    to: String(form.get("to") ?? ""),
    confidence: String(form.get("confidence") ?? ""),
    listing: String(form.get("listing") ?? ""),
    exclude: String(form.get("exclude") ?? ""),
    set: String(form.get("set") ?? ""),
    rarity: String(form.get("rarity") ?? ""),
    printing: String(form.get("printing") ?? ""),
    language: String(form.get("language") ?? ""),
  });
  const coverage = toCoverageQuery(intent);

  const watchId = String(form.get("watch") ?? "").trim();
  await saveWatch(getDb(), {
    userId: session.user.id,
    label: q,
    criteria: intent,
    coverage,
    ...(watchId ? { watchId } : {}),
  });

  return NextResponse.redirect(new URL("/watches?saved=1", request.url), 303);
}
