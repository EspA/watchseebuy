"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const LINKS = [
  { href: "/users", label: "Users" },
  { href: "/ebay", label: "eBay API" },
  { href: "/email", label: "Email" },
];

export function AdminHeader({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="header">
      <Link className="brand" href="/users">
        <img
          className="brand-mark"
          src="/brand-mark.png?v=16"
          alt=""
          width={512}
          height={512}
        />
        WatchSeeBuy admin
      </Link>
      <nav className="nav">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={pathname.startsWith(link.href) ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
        <span className="muted">{email}</span>
        <button
          type="button"
          className="btn secondary"
          onClick={() => {
            void authClient.signOut({
              fetchOptions: { onSuccess: () => {
                window.location.href = "/sign-in";
              } },
            });
          }}
        >
          Sign out
        </button>
      </nav>
    </header>
  );
}
