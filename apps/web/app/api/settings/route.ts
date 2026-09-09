import { parseShipToPostal, parseUserTimeZone } from "@waitseebuy/domain";
import { getDb, updateUserSettings } from "@waitseebuy/db";
import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/absolute-url";
import { getSession } from "@/lib/session";
import { parseTheme, THEME_COOKIE_MAX_AGE, THEME_STORAGE_KEY } from "@/lib/theme";

async function readSettingsBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      zip?: string;
      timezone?: string;
      theme?: string;
    };
    return {
      zip: body.zip,
      timezone: body.timezone,
      theme: body.theme,
      json: true,
    };
  }

  const form = await request.formData();
  return {
    zip: String(form.get("zip") ?? ""),
    timezone: String(form.get("timezone") ?? ""),
    theme: String(form.get("theme") ?? ""),
    json: false,
  };
}

function withThemeCookie(response: NextResponse, theme: string) {
  response.cookies.set(THEME_STORAGE_KEY, theme, {
    path: "/",
    maxAge: THEME_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  return response;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    const signIn = absoluteUrl("/sign-in", request);
    signIn.searchParams.set("next", "/settings");
    return NextResponse.redirect(signIn, 303);
  }

  const body = await readSettingsBody(request);
  const shipToPostal =
    body.zip === undefined ? undefined : (parseShipToPostal(body.zip) ?? null);
  const timezone =
    body.timezone === undefined ? undefined : parseUserTimeZone(body.timezone);
  const theme = body.theme === undefined ? undefined : parseTheme(body.theme);

  const updated = await updateUserSettings(getDb(), {
    userId: session.user.id,
    ...(shipToPostal !== undefined ? { shipToPostal } : {}),
    ...(timezone ? { timezone } : {}),
    ...(theme ? { theme } : {}),
  });

  if (body.json) {
    const response = NextResponse.json({
      ok: Boolean(updated),
      shipToPostal: updated?.shipToPostal ?? null,
      timezone: updated?.timezone ?? null,
      theme: updated?.theme ?? null,
    });
    return theme ? withThemeCookie(response, theme) : response;
  }

  const response = NextResponse.redirect(
    absoluteUrl("/settings?saved=1", request),
    303,
  );
  return theme ? withThemeCookie(response, theme) : response;
}
