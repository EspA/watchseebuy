"use client";

import {
  DEFAULT_EBAY_SITE,
  ebaySiteInPhrase,
  ebaySitesWithLead,
} from "@waitseebuy/domain";
import { useTranslations } from "next-intl";
import { applySiteCookie } from "@/lib/preference-cookies";

function homeHrefForSite(siteId: string) {
  return siteId === DEFAULT_EBAY_SITE ? "/" : `/?site=${siteId}`;
}

export function EbaySiteSwitch({
  site,
  form,
  homeLinks,
  formAction,
  leadSite = DEFAULT_EBAY_SITE,
}: {
  site: string;
  form?: string;
  homeLinks?: boolean;
  formAction?: string;
  leadSite?: string;
}) {
  const t = useTranslations("home");
  const sites = ebaySitesWithLead(leadSite);
  return (
    <div className="ebay-sites">
      <p>
        {t("notShopping", { place: ebaySiteInPhrase(site) })}
      </p>
      <div className="ebay-site-flags" role="group" aria-label={t("ebaySite")}>
        {sites.map((option) => {
          const selected = option.value === site;
          const className = selected
            ? "ebay-site-flag is-selected"
            : "ebay-site-flag";
          if (homeLinks) {
            return (
              <a
                key={option.value}
                className={className}
                href={homeHrefForSite(option.value)}
                title={option.label}
                aria-label={option.label}
                aria-current={selected ? "true" : undefined}
                onClick={() => applySiteCookie(option.value)}
              >
                <span aria-hidden="true">{option.flag}</span>
              </a>
            );
          }
          return (
            <button
              key={option.value}
              className={className}
              type="submit"
              {...(form ? { form } : {})}
              {...(formAction ? { formAction } : {})}
              name="site"
              value={option.value}
              title={option.label}
              aria-label={option.label}
              aria-pressed={selected}
              onClick={() => applySiteCookie(option.value)}
            >
              <span aria-hidden="true">{option.flag}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
