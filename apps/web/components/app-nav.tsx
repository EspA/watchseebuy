"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CloseIcon, MenuIcon } from "@/components/icons";

export function AppNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const links = [
    { href: "/", label: t("home"), match: (path: string) => path === "/" },
    {
      href: "/search",
      label: t("search"),
      match: (path: string) => path === "/search" || path.startsWith("/search/"),
    },
    {
      href: "/watches",
      label: t("watches"),
      match: (path: string) => path === "/watches" || path.startsWith("/watches/"),
    },
  ] as const;
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

  const linkItems = (idPrefix: string) =>
    links.map((link) => {
      const current = link.match(pathname);
      return (
        <Link
          key={`${idPrefix}-${link.href}`}
          href={link.href}
          className={current ? "is-current" : undefined}
          aria-current={current ? "page" : undefined}
        >
          {link.label}
        </Link>
      );
    });

  return (
    <div className="app-nav" ref={rootRef}>
      <nav className="nav nav-desktop" aria-label={t("primary")}>
        {linkItems("desktop")}
      </nav>
      <button
        type="button"
        className="nav-toggle"
        aria-label={open ? t("closeMenu") : t("openMenu")}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
      <nav
        id="mobile-nav"
        className="nav-drawer"
        hidden={!open}
        aria-label={t("primary")}
      >
        {linkItems("mobile")}
      </nav>
    </div>
  );
}
