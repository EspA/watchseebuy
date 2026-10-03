"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

const SearchPendingContext = createContext(false);

export function useSearchPending() {
  return useContext(SearchPendingContext);
}

export function SearchPendingProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useSearchStickyOffsets();

  return (
    <SearchPendingContext.Provider value={pending}>
      <SearchNavContext.Provider value={{ startTransition, router }}>
        {children}
      </SearchNavContext.Provider>
    </SearchPendingContext.Provider>
  );
}

function useSearchStickyOffsets() {
  useLayoutEffect(() => {
    const header = document.querySelector(".shell > .header");
    const chrome = document.querySelector(".search-chrome");
    const root = document.documentElement;
    if (!(header instanceof HTMLElement) && !(chrome instanceof HTMLElement)) {
      return;
    }

    const apply = () => {
      const headerHeight =
        header instanceof HTMLElement ? header.getBoundingClientRect().height : 0;
      const chromeHeight =
        chrome instanceof HTMLElement ? chrome.getBoundingClientRect().height : 0;
      root.style.setProperty("--search-header-offset", `${headerHeight}px`);
      root.style.setProperty(
        "--search-sticky-offset",
        `${headerHeight + chromeHeight}px`,
      );
    };

    apply();
    const observer = new ResizeObserver(apply);
    if (header instanceof HTMLElement) observer.observe(header);
    if (chrome instanceof HTMLElement) observer.observe(chrome);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--search-header-offset");
      root.style.removeProperty("--search-sticky-offset");
    };
  }, []);
}

const SearchNavContext = createContext<{
  startTransition: (fn: () => void) => void;
  router: ReturnType<typeof useRouter>;
} | null>(null);

function useSearchNav() {
  const nav = useContext(SearchNavContext);
  const router = useRouter();
  const [, startTransition] = useTransition();
  return nav ?? { router, startTransition };
}

export function useNavigateSearch() {
  const { router, startTransition } = useSearchNav();
  return (href: string) => {
    if (isCurrentSearch(href)) return;
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  };
}

function isCurrentSearch(href: string): boolean {
  if (typeof window === "undefined") return false;
  const next = new URL(href, window.location.origin);
  const current = new URL(window.location.href);
  next.searchParams.sort();
  current.searchParams.sort();
  return (
    next.pathname === current.pathname &&
    next.searchParams.toString() === current.searchParams.toString()
  );
}

function searchPathFromForm(form: HTMLFormElement): string {
  const params = new URLSearchParams();
  for (const [key, value] of new FormData(form).entries()) {
    if (typeof value === "string") params.append(key, value);
  }
  const encoded = params.toString();
  return encoded ? `/search?${encoded}` : "/search";
}

function shouldLetBrowserSubmit(event: FormEvent<HTMLFormElement>): boolean {
  const submitter = (event.nativeEvent as SubmitEvent).submitter;
  if (
    !(submitter instanceof HTMLButtonElement) &&
    !(submitter instanceof HTMLInputElement)
  ) {
    return false;
  }
  const method = (
    submitter.getAttribute("formmethod") ??
    event.currentTarget.method ??
    "get"
  ).toLowerCase();
  if (method !== "get") return true;
  const action = submitter.getAttribute("formaction");
  return Boolean(action && !action.includes("/search"));
}

export function SearchForm({ children }: { children: ReactNode }) {
  const { router, startTransition } = useSearchNav();
  return (
    <form
      id="search-form"
      className="search-block"
      action="/search"
      method="get"
      onSubmit={(event) => {
        if (shouldLetBrowserSubmit(event)) return;
        event.preventDefault();
        const href = searchPathFromForm(event.currentTarget);
        if (isCurrentSearch(href)) return;
        startTransition(() => {
          router.push(href, { scroll: false });
        });
      }}
    >
      {children}
    </form>
  );
}

export function SearchResultsPane({ children }: { children: ReactNode }) {
  const pending = useSearchPending();
  return (
    <div className={pending ? "results-pane is-pending" : "results-pane"}>
      {children}
    </div>
  );
}
