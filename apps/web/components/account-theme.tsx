"use client";

import { useEffect } from "react";
import { applyTheme, parseTheme } from "@/lib/theme";

export function AccountTheme({ theme }: { theme: string | null }) {
  useEffect(() => {
    const parsed = parseTheme(theme);
    if (!parsed) return;
    applyTheme(parsed);
  }, [theme]);

  return null;
}
