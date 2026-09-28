"use client";

import { parseUserTimeZone } from "@watchseebuy/domain";
import { useEffect, useRef } from "react";

export function TimezoneSync() {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    const timezone = parseUserTimeZone(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    if (!timezone) return;
    sent.current = true;
    void fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone }),
    });
  }, []);

  return null;
}
