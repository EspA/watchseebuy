"use client";

import { useState } from "react";
import { submitSearchForm } from "@/components/auto-search";
import { syncCatalogSearchForm } from "@/components/catalog-search-sync";

const SEARCH_FORM = "search-form";

function searchForm(): HTMLFormElement | null {
  const form = document.getElementById(SEARCH_FORM);
  return form instanceof HTMLFormElement ? form : null;
}

export function ExcludeUnofficialFilter({ checked }: { checked: boolean }) {
  const [on, setOn] = useState(checked);

  return (
    <div className="filter-chip">
      <input
        type="hidden"
        form={SEARCH_FORM}
        name="unofficial"
        value={on ? "1" : "0"}
      />
      <label>
        <input
          type="checkbox"
          checked={on}
          onChange={(event) => {
            const next = event.currentTarget.checked;
            setOn(next);
            const form = searchForm();
            const hidden = form?.elements.namedItem("unofficial");
            if (hidden instanceof HTMLInputElement) {
              hidden.value = next ? "1" : "0";
            }
            if (!form) return;
            syncCatalogSearchForm(form, "unofficial");
            submitSearchForm(form);
          }}
        />
        Exclude unofficial pieces
      </label>
      <span className="filter-tip">
        <button
          type="button"
          className="filter-tip-link"
          aria-label="What we exclude"
          aria-describedby="unofficial-tip"
        >
          ?
        </button>
        <span id="unofficial-tip" role="tooltip" className="filter-tip-bubble">
          When this is on, we ask eBay to skip custom, replica, fake, MOC,
          compatible, unlicensed, and other unofficial listings so we maximize
          your chances to see the real pieces.
        </span>
      </span>
    </div>
  );
}
