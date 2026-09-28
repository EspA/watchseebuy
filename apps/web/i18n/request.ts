import { getRequestConfig } from "next-intl/server";
import { APP_LOCALES, DEFAULT_APP_LOCALE } from "@watchseebuy/domain";
import { getDb, getUserSettings } from "@watchseebuy/db";
import { getRequestPreferences } from "@/lib/request-preferences";
import { getSession } from "@/lib/session";

async function loadMessages(locale: string) {
  switch (locale) {
    case "de":
      return (await import("../messages/de.json")).default;
    case "fr":
      return (await import("../messages/fr.json")).default;
    case "it":
      return (await import("../messages/it.json")).default;
    case "es":
      return (await import("../messages/es.json")).default;
    case "nl":
      return (await import("../messages/nl.json")).default;
    case "pl":
      return (await import("../messages/pl.json")).default;
    default:
      return (await import("../messages/en.json")).default;
  }
}

export default getRequestConfig(async () => {
  let settings = null;
  try {
    const session = await getSession();
    settings = session
      ? await getUserSettings(getDb(), session.user.id)
      : null;
  } catch {
    settings = null;
  }
  const prefs = await getRequestPreferences({ settings });
  const locale = (APP_LOCALES as readonly string[]).includes(prefs.locale)
    ? prefs.locale
    : DEFAULT_APP_LOCALE;
  return {
    locale,
    messages: await loadMessages(locale),
  };
});
