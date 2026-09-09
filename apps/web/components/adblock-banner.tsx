"use client";

import { useEffect, useState } from "react";

const EPN_PROBE_HOST = "https://rover.ebay.com/favicon.ico";

const DISMISS_KEY = "wsb-adblock-dismissed";

export function AdblockBanner() {
  const [blocked, setBlocked] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === "1") {
      setDismissed(true);
      return;
    }

    const img = new Image();
    const timer = window.setTimeout(() => setBlocked(true), 2500);
    img.onload = () => {
      window.clearTimeout(timer);
      setBlocked(false);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      setBlocked(true);
    };
    img.referrerPolicy = "no-referrer";
    img.src = `${EPN_PROBE_HOST}?t=${Date.now()}`;
    return () => window.clearTimeout(timer);
  }, []);

  if (!blocked || dismissed) return null;

  return (
    <div className="banner" role="status">
      <span>
        An ad blocker may strip the tracking on Buy. The listing should still
        open; use the direct eBay link if you want a clean URL. Those links
        fund the free product.
      </span>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, "1");
          setDismissed(true);
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
