"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

export function useOverlayMenu(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  align: "left" | "right",
  onHide: () => void,
): CSSProperties | null {
  const [style, setStyle] = useState<CSSProperties | null>(null);
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!open || !anchor) {
      setStyle(null);
      return;
    }
    const scroller = anchor.closest(".watch-save");
    if (
      !(scroller instanceof HTMLElement) ||
      getComputedStyle(scroller).overflowY !== "auto"
    ) {
      setStyle(null);
      return;
    }

    const place = () => {
      const rect = anchor.getBoundingClientRect();
      const bounds = scroller.getBoundingClientRect();
      if (rect.bottom <= bounds.top || rect.top >= bounds.bottom) {
        onHideRef.current();
        return;
      }
      const width = Math.max(rect.width, 224);
      const preferred = align === "right" ? rect.right - width : rect.left;
      const left = Math.max(8, Math.min(preferred, window.innerWidth - width - 8));
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
      setStyle({
        position: "fixed",
        left,
        right: "auto",
        width,
        zIndex: 80,
        ...(openUp
          ? { top: "auto", bottom: window.innerHeight - rect.top + 6 }
          : { top: rect.bottom + 6, bottom: "auto" }),
      });
    };

    place();
    scroller.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      scroller.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, [open, anchorRef, align]);

  return style;
}
