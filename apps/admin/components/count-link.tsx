import Link from "next/link";

export function CountLink({
  count,
  href,
}: {
  count: number;
  href: string;
}) {
  if (count <= 0) return count;
  return (
    <Link className="count-link" href={href}>
      {count}
    </Link>
  );
}
