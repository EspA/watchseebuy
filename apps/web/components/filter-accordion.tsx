"use client";

import {
  createContext,
  useContext,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import type { FilterGroupId } from "@watchseebuy/domain";

export type FilterAccordionId = FilterGroupId;

const FilterAccordionContext = createContext<{
  openId?: FilterAccordionId;
  setOpenId: (id: FilterAccordionId | undefined) => void;
} | null>(null);

export function FilterAccordion({
  children,
  initialOpen,
}: {
  children: ReactNode;
  initialOpen?: FilterAccordionId;
}) {
  const [openId, setOpenId] = useState(initialOpen);
  return (
    <FilterAccordionContext.Provider value={{ openId, setOpenId }}>
      {children}
    </FilterAccordionContext.Provider>
  );
}

export function useFilterGroup(
  id: FilterAccordionId,
  hasSelection: boolean,
): {
  open: boolean;
  onSummaryClick?: (event: MouseEvent<HTMLElement>) => void;
} {
  const accordion = useContext(FilterAccordionContext);
  if (!accordion) return { open: hasSelection };
  const open = accordion.openId === id;
  return {
    open,
    // Control the section from the summary click. A toggle listener that
    // writes `open` back fights the browser and loops when a search lands
    // with the section already open.
    onSummaryClick: (event) => {
      event.preventDefault();
      accordion.setOpenId(open ? undefined : id);
    },
  };
}
