import { Suspense } from "react";
import Link from "next/link";
import { AccountMenu } from "@/components/account-menu";
import { AppNav } from "@/components/app-nav";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";

export function HeaderTools() {
  return (
    <div className="header-end">
      <AppNav />
      <div className="header-actions">
        <ThemeToggle />
        <Suspense fallback={<span className="account-slot" aria-hidden />}>
          <AccountMenu />
        </Suspense>
      </div>
    </div>
  );
}

export function Header() {
  return (
    <header className="header">
      <Link className="brand" href="/">
        <BrandMark className="brand-mark" />
        WaitSeeBuy
      </Link>
      <HeaderTools />
    </header>
  );
}
