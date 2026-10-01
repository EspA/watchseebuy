"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_EBAY_SITE,
  ebaySiteInPhrase,
  ebaySiteOf,
  ebaySitesWithLead,
} from "@watchseebuy/domain";
import { useTranslations } from "next-intl";
import { applySiteCookie } from "@/lib/preference-cookies";

function homeHrefForSite(siteId: string, keepAgent: boolean) {
  const params = new URLSearchParams();
  if (siteId !== DEFAULT_EBAY_SITE) params.set("site", siteId);
  if (!keepAgent) params.set("mode", "classic");
  const encoded = params.toString();
  return encoded ? `/?${encoded}` : "/";
}

export function EbaySiteSwitch({
  site,
  leadSite = DEFAULT_EBAY_SITE,
  keepAgent = false,
}: {
  site: string;
  leadSite?: string;
  keepAgent?: boolean;
}) {
  const t = useTranslations("home");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = ebaySiteOf(site);
  const sites = ebaySitesWithLead(leadSite);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="ebay-sites">
      <p>{t("notShopping", { place: ebaySiteInPhrase(site) })}</p>
      <div className="ebay-site-select" ref={rootRef}>
        <button
          type="button"
          className="ebay-site-trigger"
          aria-label={current.label}
          title={current.label}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true">{current.flag}</span>
          <span>{current.label}</span>
        </button>
        {open ? (
          <ul
            className="ebay-site-menu"
            role="listbox"
            aria-label={t("ebaySite")}
          >
            {sites.map((option) => {
              const selected = option.value === site;
              return (
                <li key={option.value} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    className={
                      selected
                        ? "ebay-site-option is-selected"
                        : "ebay-site-option"
                    }
                    onClick={() => {
                      applySiteCookie(option.value);
                      setOpen(false);
                      router.push(homeHrefForSite(option.value, keepAgent));
                    }}
                  >
                    <span aria-hidden="true">{option.flag}</span>
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
