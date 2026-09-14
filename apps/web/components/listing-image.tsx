"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon, ZoomIcon } from "@/components/icons";

function enlargeEbayImage(src: string): string {
  return src.replace(/\/s-l\d+\./i, "/s-l1600.");
}

export function ListingImage({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  const largeSrc = enlargeEbayImage(src);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="listing-media">
      {/* eBay listing thumbs; remote host varies by CDN. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" />
      <button
        type="button"
        className="listing-zoom"
        aria-label={`Zoom photo: ${alt}`}
        onClick={() => setOpen(true)}
      >
        <ZoomIcon />
      </button>
      {open
        ? createPortal(
            <div
              className="listing-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label={alt}
            >
              <button
                type="button"
                className="listing-lightbox-backdrop"
                aria-label="Close zoomed photo"
                onClick={() => setOpen(false)}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={largeSrc} alt={alt} />
              <button
                type="button"
                className="listing-lightbox-close"
                aria-label="Close zoomed photo"
                onClick={() => setOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
