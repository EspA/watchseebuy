export const THEME_STORAGE_KEY = "wsb-theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type Theme = "light" | "dark";

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "light" || value === "dark";
}

export function parseTheme(raw: string | undefined | null): Theme | undefined {
  const value = raw?.trim();
  return isTheme(value) ? value : undefined;
}

export function themeFromDocument(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function preferredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(stored) ? stored : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.cookie = `${THEME_STORAGE_KEY}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
}

export const THEME_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var c=document.cookie.match(new RegExp("(?:^|; )"+k+"=(light|dark)"));var s=c&&c[1];if(!s)s=localStorage.getItem(k);var t=s==="light"||s==="dark"?s:"light";document.documentElement.dataset.theme=t;}catch(e){}})();`;
