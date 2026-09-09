"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const POLICY_LINKS = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
  { href: "/contact", label: "Contact Us" },
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

const COPYRIGHT = "© 2026 WaitSeeBuy.com";

export function SiteFooter({
  disclosure,
}: {
  disclosure?: string;
}) {
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
          Terms and Policies
        </button>
        {open ? (
          <ul className="site-footer-legal-menu" role="menu">
            {POLICY_LINKS.map((item) => (
              <li key={item.href} role="none">
                <Link
                  className="site-footer-legal-item"
                  role="menuitem"
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
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
