import {
  parseAppLocale,
  parseEbaySite,
  parseShipToPostal,
  parseUserTimeZone,
} from "@watchseebuy/domain";
import { getDb, updateUserSettings } from "@watchseebuy/db";
import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/absolute-url";
import {
  EBAY_SITE_COOKIE,
  LOCALE_COOKIE,
  preferenceCookieOptions,
} from "@/lib/locale";
import { getSession } from "@/lib/session";
import { parseTheme, THEME_COOKIE_MAX_AGE, THEME_STORAGE_KEY } from "@/lib/theme";

async function readSettingsBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      zip?: string;
      timezone?: string;
      theme?: string;
      site?: string;
      locale?: string;
    };
    return {
      zip: body.zip,
      timezone: body.timezone,
      theme: body.theme,
      site: body.site,
      locale: body.locale,
      json: true,
    };
  }

  const form = await request.formData();
  return {
    zip: String(form.get("zip") ?? ""),
    timezone: String(form.get("timezone") ?? ""),
    theme: String(form.get("theme") ?? ""),
    site: String(form.get("site") ?? ""),
    locale: String(form.get("locale") ?? ""),
    json: false,
  };
}

function withPreferenceCookies(
  response: NextResponse,
  prefs: { theme?: string; site?: string; locale?: string },
) {
  if (prefs.theme) {
    response.cookies.set(THEME_STORAGE_KEY, prefs.theme, {
      path: "/",
      maxAge: THEME_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }
  if (prefs.site) {
    response.cookies.set(EBAY_SITE_COOKIE, prefs.site, preferenceCookieOptions());
  }
  if (prefs.locale) {
    response.cookies.set(LOCALE_COOKIE, prefs.locale, preferenceCookieOptions());
  }
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
  const ebaySite =
    body.site === undefined ? undefined : (parseEbaySite(body.site) ?? null);
  const locale =
    body.locale === undefined ? undefined : (parseAppLocale(body.locale) ?? null);

  const updated = await updateUserSettings(getDb(), {
    userId: session.user.id,
    ...(shipToPostal !== undefined ? { shipToPostal } : {}),
    ...(timezone ? { timezone } : {}),
    ...(theme ? { theme } : {}),
    ...(ebaySite !== undefined ? { ebaySite } : {}),
    ...(locale !== undefined ? { locale } : {}),
  });

  const cookies = {
    ...(theme ? { theme } : {}),
    ...(ebaySite ? { site: ebaySite } : {}),
    ...(locale ? { locale } : {}),
  };

  if (body.json) {
    const response = NextResponse.json({
      ok: Boolean(updated),
      shipToPostal: updated?.shipToPostal ?? null,
      timezone: updated?.timezone ?? null,
      theme: updated?.theme ?? null,
      ebaySite: updated?.ebaySite ?? null,
      locale: updated?.locale ?? null,
    });
    return withPreferenceCookies(response, cookies);
  }

  const response = NextResponse.redirect(
    absoluteUrl("/settings?saved=1", request),
    303,
  );
  return withPreferenceCookies(response, cookies);
}
