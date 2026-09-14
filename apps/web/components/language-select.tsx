"use client";

import { APP_LOCALE_FILTERS, type AppLocale } from "@waitseebuy/domain";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { applyLocaleCookie } from "@/lib/preference-cookies";

async function persistLocale(locale: AppLocale) {
  try {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    });
  } catch {
    // Cookie already holds the choice for this browser.
  }
}

export function LanguageSelect() {
  const locale = useLocale();
  const t = useTranslations("language");
  const router = useRouter();
  const { data: session } = authClient.useSession();

  return (
    <label className="language-select">
      <span className="language-select-short" aria-hidden>
        {locale.toUpperCase()}
      </span>
      <select
        aria-label={t("label")}
        value={locale}
        onChange={async (event) => {
          const next = event.target.value as AppLocale;
          applyLocaleCookie(next);
          if (session) await persistLocale(next);
          router.refresh();
        }}
      >
        {APP_LOCALE_FILTERS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
