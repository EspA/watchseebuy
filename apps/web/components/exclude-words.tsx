import { AutoText } from "@/components/auto-search";

export function ExcludeWords({
  value,
  form,
}: {
  value: string;
  form?: string;
}) {
  return (
    <details className="search-exclude" {...(value ? { open: true } : {})}>
      <summary>Exclude words</summary>
      <AutoText
        {...(form ? { form } : {})}
        name="exclude"
        type="text"
        defaultValue={value}
        placeholder="lot, broken, reproduction"
        aria-label="Words to exclude from search"
        autoComplete="off"
      />
    </details>
  );
}
