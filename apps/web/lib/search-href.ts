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

export function searchHrefWithMode(
  query: Record<string, string | undefined>,
  mode: "agent" | "classic" | null,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === "mode" || key === "page" || key === "error" || value === undefined) {
      continue;
    }
    params.set(key, value);
  }
  if (mode === "agent" || mode === "classic") params.set("mode", mode);
  const encoded = params.toString();
  return encoded ? `/search?${encoded}` : "/search";
}

const AGENT_SEARCH_SKIP = new Set(["mode", "page", "error", "sort", "watch"]);

export function agentSearchState(
  query: Record<string, string | undefined>,
): Record<string, string> {
  const state: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || AGENT_SEARCH_SKIP.has(key)) continue;
    state[key] = value;
  }
  return state;
}
