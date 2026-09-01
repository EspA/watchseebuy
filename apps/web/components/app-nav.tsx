import Link from "next/link";

export function AppNav() {
  return (
    <nav className="nav">
      <Link href="/">Home</Link>
      <Link href="/search">Search</Link>
      <Link href="/watches">Watches</Link>
    </nav>
  );
}
