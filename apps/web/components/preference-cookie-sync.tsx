"use client";

import { useEffect } from "react";
import type { AppLocale } from "@waitseebuy/domain";
import {
  applyPreferenceCookies,
  EBAY_SITE_COOKIE,
  LOCALE_COOKIE,
} from "@/lib/preference-cookies";

function hasCookie(name: string) {
  return document.cookie.split("; ").some((part) => part.startsWith(`${name}=`));
}

export function PreferenceCookieSync({
  site,
  locale,
}: {
  site: string;
  locale: AppLocale;
}) {
  useEffect(() => {
    if (hasCookie(EBAY_SITE_COOKIE) && hasCookie(LOCALE_COOKIE)) return;
    applyPreferenceCookies(site, locale);
  }, [site, locale]);
  return null;
}
