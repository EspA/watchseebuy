"use client";

import { useLayoutEffect, useRef, useState } from "react";

export function ListingDescription({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      if (open) return;
      setOverflows(el.scrollHeight > el.clientHeight + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, open]);

  return (
    <div
      className={
        overflows && !open ? "listing-desc-wrap has-more" : "listing-desc-wrap"
      }
    >
      <p
        ref={ref}
        className={open ? "listing-desc is-open" : "listing-desc"}
      >
        {text}
      </p>
      {overflows && !open ? (
        <button
          className="listing-more"
          type="button"
          onClick={() => setOpen(true)}
        >
          Read more...
        </button>
      ) : null}
    </div>
  );
}
