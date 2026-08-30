"use client";

import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

let scheduled: number | undefined;

function formHasQuery(form: HTMLFormElement): boolean {
  const q = form.elements.namedItem("q");
  return q instanceof HTMLInputElement && Boolean(q.value.trim());
}

export function submitSearchForm(form: HTMLFormElement | null | undefined) {
  if (scheduled !== undefined) {
    window.clearTimeout(scheduled);
    scheduled = undefined;
  }
  if (!form || !formHasQuery(form)) return;
  form.requestSubmit();
}

export function scheduleSearchSubmit(
  form: HTMLFormElement | null | undefined,
  ms = 400,
) {
  if (!form || !formHasQuery(form)) return;
  if (scheduled !== undefined) window.clearTimeout(scheduled);
  scheduled = window.setTimeout(() => {
    scheduled = undefined;
    form.requestSubmit();
  }, ms);
}

export function AutoSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { onChange, ...rest } = props;
  return (
    <select
      {...rest}
      onChange={(event) => {
        onChange?.(event);
        submitSearchForm(event.currentTarget.form);
      }}
    />
  );
}

export function AutoText(props: InputHTMLAttributes<HTMLInputElement>) {
  const { onChange, onBlur, ...rest } = props;
  return (
    <input
      {...rest}
      onChange={(event) => {
        onChange?.(event);
        scheduleSearchSubmit(event.currentTarget.form);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        if (scheduled !== undefined) {
          submitSearchForm(event.currentTarget.form);
        }
      }}
    />
  );
}
