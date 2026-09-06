import { parseShipToPostal, parseUserTimeZone } from "@waitseebuy/domain";
import { getDb, updateUserSettings } from "@waitseebuy/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

async function readSettingsBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      zip?: string;
      timezone?: string;
    };
    return {
      zip: body.zip,
      timezone: body.timezone,
      json: true,
    };
  }

  const form = await request.formData();
  return {
    zip: String(form.get("zip") ?? ""),
    timezone: String(form.get("timezone") ?? ""),
    json: false,
  };
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", "/settings");
    return NextResponse.redirect(signIn, 303);
  }

  const body = await readSettingsBody(request);
  const shipToPostal =
    body.zip === undefined ? undefined : (parseShipToPostal(body.zip) ?? null);
  const timezone =
    body.timezone === undefined ? undefined : parseUserTimeZone(body.timezone);

  const updated = await updateUserSettings(getDb(), {
    userId: session.user.id,
    ...(shipToPostal !== undefined ? { shipToPostal } : {}),
    ...(timezone ? { timezone } : {}),
  });

  if (body.json) {
    return NextResponse.json({
      ok: Boolean(updated),
      shipToPostal: updated?.shipToPostal ?? null,
      timezone: updated?.timezone ?? null,
    });
  }

  return NextResponse.redirect(new URL("/settings?saved=1", request.url), 303);
}
