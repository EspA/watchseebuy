"use client";

import { useEffect, useRef, useState } from "react";
import { useNavigateSearch } from "@/components/search-navigation";
import {
  DEFAULT_EBAY_SITE,
  ebaySiteOf,
  ebaySitesWithLead,
} from "@watchseebuy/domain";
import { useTranslations } from "next-intl";
import { applySiteCookie } from "@/lib/preference-cookies";

function searchUrlForSite(form: HTMLFormElement | null, next: string): string {
  const params = new URLSearchParams(window.location.search);
  const query = form?.elements.namedItem("q");
  if (query instanceof HTMLInputElement && query.value.trim()) {
    params.set("q", query.value.trim());
  }
  if (next === DEFAULT_EBAY_SITE) params.delete("site");
  else params.set("site", next);
  const encoded = params.toString();
  return encoded ? `/search?${encoded}` : "/search";
}

export function EbaySiteSelect({ site }: { site: string }) {
  const t = useTranslations("search");
  const navigateSearch = useNavigateSearch();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(site);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const current = ebaySiteOf(value);

  useEffect(() => {
    setValue(site);
  }, [site]);

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
    <div className="search-site" ref={rootRef}>
      <input ref={inputRef} type="hidden" name="site" value={value} />
      <button
        type="button"
        className="search-site-trigger"
        aria-label={current.label}
        title={current.label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">{current.flag}</span>
      </button>
      {open ? (
        <ul className="search-site-menu" role="listbox" aria-label={t("ebaySite")}>
          {ebaySitesWithLead(current.value).map((option) => {
            const selected = option.value === value;
            return (
              <li key={option.value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={
                    selected ? "search-site-option is-selected" : "search-site-option"
                  }
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setValue(option.value);
                    applySiteCookie(option.value);
                    setOpen(false);
                    navigateSearch(
                      searchUrlForSite(
                        inputRef.current?.form ??
                          rootRef.current?.closest("form") ??
                          null,
                        option.value,
                      ),
                    );
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
  );
}
