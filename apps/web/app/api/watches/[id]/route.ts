import { dollarsToCents, parseWatchFrequency } from "@waitseebuy/domain";
import { getDb, updateWatchSettings } from "@waitseebuy/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url), 303);
  }

  const { id } = await params;
  const form = await request.formData();
  const rawMax = String(form.get("max") ?? "");
  const trimmedMax = rawMax.trim();
  const parsedMax = dollarsToCents(rawMax);

  await updateWatchSettings(getDb(), {
    userId: session.user.id,
    watchId: id,
    alertFrequency: parseWatchFrequency(String(form.get("frequency") ?? "")),
    ...(trimmedMax === ""
      ? { maxLandedCents: null }
      : parsedMax !== undefined
        ? { maxLandedCents: parsedMax }
        : {}),
  });

  return NextResponse.redirect(new URL("/watches", request.url), 303);
}
