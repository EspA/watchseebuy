"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const POLICY_HREFS = [
  { href: "/privacy", key: "privacy" },
  { href: "/terms", key: "tos" },
  { href: "/contact", key: "contact" },
] as const;

function InstagramMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="17.4" cy="6.6" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

const COPYRIGHT = "© 2026 WatchSeeBuy.com";

export function SiteFooter({
  disclosure,
}: {
  disclosure?: string;
}) {
  const t = useTranslations("footer");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
    <footer className="site-footer">
      <p className="site-footer-credit">{COPYRIGHT}</p>
      <div className="site-footer-center" ref={rootRef}>
        {disclosure ? <p className="site-footer-disclosure">{disclosure}</p> : null}
        <button
          type="button"
          className="site-footer-legal-trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {t("terms")}
        </button>
        {open ? (
          <ul className="site-footer-legal-menu" role="menu">
            {POLICY_HREFS.map((item) => (
              <li key={item.href} role="none">
                <Link
                  className="site-footer-legal-item"
                  role="menuitem"
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <a
        className="site-footer-social"
        href="#"
        aria-label="Instagram"
        onClick={(event) => event.preventDefault()}
      >
        <InstagramMark />
      </a>
    </footer>
  );
}
