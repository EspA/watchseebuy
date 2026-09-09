import { searchParamsFromIntent, toCoverageQuery, watchLimitForPlan } from "@waitseebuy/domain";
import { getDb, saveWatch } from "@waitseebuy/db";
import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/absolute-url";
import { intentFromSearchQuery } from "@/lib/search-params";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    const signIn = absoluteUrl("/sign-in", request);
    signIn.searchParams.set("next", "/search");
    return NextResponse.redirect(signIn, 303);
  }

  const form = await request.formData();
  const q = String(form.get("q") ?? "").trim();
  if (!q) {
    return NextResponse.redirect(absoluteUrl("/search?error=empty", request), 303);
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
    score: String(form.get("score") ?? ""),
    listing: String(form.get("listing") ?? ""),
    exclude: String(form.get("exclude") ?? ""),
    set: String(form.get("set") ?? ""),
    rarity: String(form.get("rarity") ?? ""),
    printing: String(form.get("printing") ?? ""),
    language: String(form.get("language") ?? ""),
    grader: String(form.get("grader") ?? ""),
    grade: String(form.get("grade") ?? ""),
    cardLine: String(form.get("cardLine") ?? ""),
    cardCategory: String(form.get("cardCategory") ?? ""),
    cardGame: String(form.get("cardGame") ?? ""),
    cardNoReprints: String(form.get("cardNoReprints") ?? ""),
    cardNoProxy: String(form.get("cardNoProxy") ?? ""),
    unofficial: String(form.get("unofficial") ?? ""),
    figureCategory: String(form.get("figureCategory") ?? ""),
    figureScale: String(form.get("figureScale") ?? ""),
    figurePackaging: String(form.get("figurePackaging") ?? ""),
    figureCompleteness: String(form.get("figureCompleteness") ?? ""),
    figurePunch: String(form.get("figurePunch") ?? ""),
    brickCategory: String(form.get("brickCategory") ?? ""),
    brickType: String(form.get("brickType") ?? ""),
    brickStatus: String(form.get("brickStatus") ?? ""),
    wheelsCategory: String(form.get("wheelsCategory") ?? ""),
    wheelsScale: String(form.get("wheelsScale") ?? ""),
    wheelsPackaging: String(form.get("wheelsPackaging") ?? ""),
    site: String(form.get("site") ?? ""),
  });
  const coverage = toCoverageQuery(intent);

  const watchId = String(form.get("watch") ?? "").trim();
  const saved = await saveWatch(getDb(), {
    userId: session.user.id,
    label: q,
    criteria: intent,
    coverage,
    watchLimit: watchLimitForPlan("free"),
    ...(watchId ? { watchId } : {}),
  });

  if (!saved.ok) {
    const params = searchParamsFromIntent(q, intent, watchId || undefined);
    params.set("error", "limit");
    return NextResponse.redirect(absoluteUrl(`/search?${params}`, request), 303);
  }

  return NextResponse.redirect(absoluteUrl("/watches?saved=1", request), 303);
}
