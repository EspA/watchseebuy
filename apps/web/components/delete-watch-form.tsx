"use client";

import { useTranslations } from "next-intl";

export function DeleteWatchForm({ watchId }: { watchId: string }) {
  const t = useTranslations("watches");
  return (
    <form action={`/api/watches/${watchId}/delete`} method="post">
      <button className="btn secondary" type="submit">
        {t("stopWatching")}
      </button>
    </form>
  );
}
