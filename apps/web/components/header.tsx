import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { BrandMark } from "@/components/brand-mark";

export function Header() {
  return (
    <header className="header">
      <Link className="brand" href="/">
        <BrandMark className="brand-mark" />
        WaitSeeBuy
      </Link>
      <AppNav />
    </header>
  );
}
