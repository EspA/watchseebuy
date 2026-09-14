export function searchHrefWithPage(
  query: Record<string, string | undefined>,
  page: number,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === "page" || key === "error" || value === undefined) continue;
    params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const encoded = params.toString();
  return encoded ? `/search?${encoded}` : "/search";
}
