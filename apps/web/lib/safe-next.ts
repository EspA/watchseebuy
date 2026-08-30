export function safeNext(next: string | undefined, fallback = "/watches") {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }
  return next;
}
