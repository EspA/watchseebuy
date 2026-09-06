"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home", match: (path: string) => path === "/" },
  {
    href: "/search",
    label: "Search",
    match: (path: string) => path === "/search" || path.startsWith("/search/"),
  },
  {
    href: "/watches",
    label: "Watches",
    match: (path: string) => path === "/watches" || path.startsWith("/watches/"),
  },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="nav" aria-label="Primary">
      {LINKS.map((link) => {
        const current = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={current ? "is-current" : undefined}
            aria-current={current ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
