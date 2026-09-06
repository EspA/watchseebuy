"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from "react";

export type FilterAccordionId = "cards" | "figures" | "vehicles" | "bricks";

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
  onToggle: (event: SyntheticEvent<HTMLDetailsElement>) => void;
} {
  const accordion = useContext(FilterAccordionContext);
  if (!accordion) {
    return {
      open: hasSelection,
      onToggle: () => undefined,
    };
  }
  return {
    open: accordion.openId === id,
    onToggle: (event) => {
      if (event.currentTarget.open) accordion.setOpenId(id);
      else if (accordion.openId === id) accordion.setOpenId(undefined);
    },
  };
}
