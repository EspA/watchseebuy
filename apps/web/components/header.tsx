import { Suspense } from "react";
import Link from "next/link";
import { AccountMenu } from "@/components/account-menu";
import { AppNav } from "@/components/app-nav";
import { BrandMark } from "@/components/brand-mark";
import { LanguageSelect } from "@/components/language-select";
import { ThemeToggle } from "@/components/theme-toggle";

export function HeaderTools() {
  return (
    <div className="header-end">
      <AppNav />
      <div className="header-actions">
        <LanguageSelect />
        <ThemeToggle />
        <Suspense fallback={<span className="account-slot" aria-hidden />}>
          <AccountMenu />
        </Suspense>
      </div>
    </div>
  );
}

export function BrandLink() {
  return (
    <Link className="brand" href="/">
      <BrandMark className="brand-mark" />
      WaitSeeBuy
    </Link>
  );
}

export function Header() {
  return (
    <header className="header">
      <BrandLink />
      <HeaderTools />
    </header>
  );
}
