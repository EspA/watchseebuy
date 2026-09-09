"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { applyTheme, themeFromDocument, type Theme } from "@/lib/theme";

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15.2 3.2a8.4 8.4 0 1 0 5.6 13.2A7.1 7.1 0 0 1 15.2 3.2z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 3.2v1.8M12 19v1.8M4.9 4.9l1.3 1.3M17.8 17.8l1.3 1.3M3.2 12H5M19 12h1.8M4.9 19.1l1.3-1.3M17.8 6.2l1.3-1.3" />
    </svg>
  );
}

async function persistTheme(theme: Theme) {
  try {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme }),
    });
  } catch {
    // Cookie and localStorage already hold the choice for this browser.
  }
}

export function ThemeToggle() {
  const { data: session } = authClient.useSession();
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(themeFromDocument());
  }, []);

  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={next === "dark" ? "Switch to dark mode" : "Switch to light mode"}
      aria-pressed={theme === "dark"}
      onClick={() => {
        applyTheme(next);
        setTheme(next);
        if (session) void persistTheme(next);
      }}
    >
      <span className="theme-icon theme-icon-moon">
        <MoonIcon />
      </span>
      <span className="theme-icon theme-icon-sun">
        <SunIcon />
      </span>
    </button>
  );
}
