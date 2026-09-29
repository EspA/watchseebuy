"use client";

import { useTranslations } from "next-intl";
import { useNavigateSearch } from "@/components/search-navigation";

export function SearchModeSwitch({
  mode,
  onChange,
  classicHref,
  agentHref,
}: {
  mode: "classic" | "agent";
  onChange?: (mode: "classic" | "agent") => void;
  classicHref?: string;
  agentHref?: string;
}) {
  const t = useTranslations("agent");
  const navigateSearch = useNavigateSearch();

  function choose(next: "classic" | "agent") {
    if (next === mode) return;
    if (onChange) {
      onChange(next);
      return;
    }
    const href = next === "agent" ? agentHref : classicHref;
    if (href) navigateSearch(href);
  }

  return (
    <div className="search-mode" role="group" aria-label={t("switchLabel")}>
      <button
        type="button"
        aria-pressed={mode === "agent"}
        onClick={() => choose("agent")}
      >
        {t("ai")}
      </button>
      <button
        type="button"
        aria-pressed={mode === "classic"}
        onClick={() => choose("classic")}
      >
        {t("classic")}
      </button>
    </div>
  );
}
