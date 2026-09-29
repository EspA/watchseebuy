"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { DEFAULT_EBAY_SITE } from "@watchseebuy/domain";
import { AgentChat } from "@/components/agent-chat";
import { EbaySiteSwitch } from "@/components/ebay-site-switch";
import { SearchModeSwitch } from "@/components/search-mode-switch";
import { SearchSubmit } from "@/components/search-submit";

export function HomeSearch({
  site,
  leadSite,
  agent,
}: {
  site: string;
  leadSite: string;
  agent: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("home");

  function choose(next: "classic" | "agent") {
    const params = new URLSearchParams(window.location.search);
    if (next === "classic") params.set("mode", "classic");
    else params.delete("mode");
    const encoded = params.toString();
    router.replace(encoded ? `/?${encoded}` : "/", { scroll: false });
  }

  return (
    <>
      <div className="tease-search-stack">
        <SearchModeSwitch
          mode={agent ? "agent" : "classic"}
          onChange={choose}
        />
        {agent ? (
          <AgentChat site={site} />
        ) : (
          <form className="search tease-search" action="/search" method="get">
            <input type="hidden" name="mode" value="classic" />
            {site !== DEFAULT_EBAY_SITE ? (
              <input type="hidden" name="site" value={site} />
            ) : null}
            <input
              name="q"
              type="search"
              required
              placeholder={t("placeholder")}
              aria-label={t("searchLabel")}
            />
            <SearchSubmit />
          </form>
        )}
      </div>
      <EbaySiteSwitch site={site} leadSite={leadSite} keepAgent={agent} />
    </>
  );
}
