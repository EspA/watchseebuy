import { dollarsToCents, parseWatchFrequency } from "@watchseebuy/domain";
import { getDb, updateWatchSettings } from "@watchseebuy/db";
import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/absolute-url";
import { getSession } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(absoluteUrl("/sign-in", request), 303);
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

  return NextResponse.redirect(absoluteUrl("/watches", request), 303);
}
