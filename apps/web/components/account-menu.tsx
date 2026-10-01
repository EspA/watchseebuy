"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";

function UserIcon() {
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
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.2 19.2c.8-3.1 3.5-5 6.8-5s6 1.9 6.8 5" />
    </svg>
  );
}

export function AccountMenu() {
  const t = useTranslations("account");
  const { data: session, isPending } = authClient.useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
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

  if (isPending) {
    return <span className="account-slot" aria-hidden />;
  }

  if (!session) {
    if (pathname === "/sign-in") return null;
    const search = searchParams.toString();
    const next = search ? `${pathname}?${search}` : pathname;
    return (
      <Link
        className="account-signin"
        href={`/sign-in?next=${encodeURIComponent(next)}`}
      >
        {t("signIn")}
      </Link>
    );
  }

  return (
    <div className="account" ref={rootRef}>
      <button
        type="button"
        className="account-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("account")}
        onClick={() => setOpen((value) => !value)}
      >
        {session.user.image ? (
          <img src={session.user.image} alt="" />
        ) : (
          <UserIcon />
        )}
      </button>
      {open ? (
        <div className="account-menu" role="menu">
          {session.user.email ? (
            <p className="account-menu-email" title={session.user.email}>
              {session.user.email}
            </p>
          ) : null}
          <Link className="account-menu-item" role="menuitem" href="/settings">
            {t("settings")}
          </Link>
          <button
            type="button"
            className="account-menu-item"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              const { error } = await authClient.signOut();
              if (error) return;
              if (
                pathname === "/watches" ||
                pathname.startsWith("/watches/") ||
                pathname === "/settings" ||
                pathname.startsWith("/settings/")
              ) {
                window.location.assign(
                  `/sign-in?next=${encodeURIComponent(pathname)}`,
                );
                return;
              }
              router.refresh();
            }}
          >
            {t("signOut")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
