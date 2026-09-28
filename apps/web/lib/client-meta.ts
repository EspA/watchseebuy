export function clientMeta(headers: Headers): {
  ip: string | null;
  country: string | null;
} {
  const forwarded = headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    null;
  const country =
    headers.get("cf-ipcountry") ||
    headers.get("x-appengine-country") ||
    headers.get("x-client-geo-country") ||
    null;
  const normalizedCountry =
    country && country !== "XX" && country !== "T1" ? country : null;
  return { ip, country: normalizedCountry };
}

export function persistUserEvent(input: {
  kind: "search" | "buy_click";
  userId?: string | null;
  ip?: string | null;
  meta?: Record<string, unknown> | null;
}) {
  return import("@watchseebuy/db").then(async ({ getDb, recordUserEvent }) => {
    await recordUserEvent(getDb(), input);
  }).catch((error: unknown) => {
    console.error(
      JSON.stringify({
        at: new Date().toISOString(),
        message: "user_events insert failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  });
}
