"use client";

import { useTranslations } from "next-intl";
import { AutoText } from "@/components/auto-search";

export function ExcludeWords({
  value,
  form,
}: {
  value: string;
  form?: string;
}) {
  const t = useTranslations("search");
  return (
    <details className="search-exclude">
      <summary>{t("excludeWords")}</summary>
      <AutoText
        {...(form ? { form } : {})}
        name="exclude"
        type="text"
        defaultValue={value}
        placeholder={t("excludePlaceholder")}
        aria-label={t("excludeAria")}
        autoComplete="off"
      />
    </details>
  );
}
