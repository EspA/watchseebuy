import Link from "next/link";
import { getSession } from "@/lib/session";

export async function Header() {
  const session = await getSession();

  return (
    <header className="header">
      <Link className="brand" href="/">
        WaitSeeBuy
      </Link>
      <nav className="nav">
        <Link href="/search">Search</Link>
        {session ? (
          <Link href="/watches">Watches</Link>
        ) : (
          <Link href="/sign-in">Sign in</Link>
        )}
      </nav>
    </header>
  );
}
