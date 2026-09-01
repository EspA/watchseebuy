"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const SEARCH_FORM = "search-form";

function resetFilterField(field: Element) {
  if (field instanceof HTMLSelectElement) {
    if (field.name === "listing") field.value = "all";
    else if (field.name === "grade") field.value = "10";
    else if (field.name === "score" || field.name === "confidence") {
      field.value = "";
    } else {
      field.value = "any";
    }
    return;
  }
  if (
    field instanceof HTMLInputElement &&
    field.type !== "hidden" &&
    field.type !== "submit"
  ) {
    field.value = "";
  }
}

export function resetSearchFilters(query: string) {
  const form = document.getElementById(SEARCH_FORM);
  if (!(form instanceof HTMLFormElement)) return;
  const q = form.elements.namedItem("q");
  if (q instanceof HTMLInputElement) q.value = query;
  for (const field of Array.from(form.elements)) {
    if (!(field instanceof HTMLElement) || !("name" in field)) continue;
    const name = field.name;
    if (
      !name ||
      name === "q" ||
      name === "watch" ||
      name === "sort" ||
      name === "exclude" ||
      name === "zip"
    ) {
      continue;
    }
    resetFilterField(field);
  }
}

export function ClearFiltersLink({
  href,
  query,
}: {
  href: string;
  query: string;
}) {
  const router = useRouter();
  return (
    <Link
      className="clear-filters"
      href={href}
      onClick={(event) => {
        event.preventDefault();
        resetSearchFilters(query);
        router.push(href);
      }}
    >
      Clear filters
    </Link>
  );
}
