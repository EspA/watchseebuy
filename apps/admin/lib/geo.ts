const cache = new Map<string, { label: string; expiresAt: number }>();
const TTL_MS = 24 * 60 * 60 * 1000;

export function isPrivateIp(ip: string) {
  if (ip === "::1" || ip === "127.0.0.1" || ip === "0.0.0.0") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("fd")) {
    return true;
  }
  const match = /^172\.(\d+)\./.exec(ip);
  if (match) {
    const octet = Number(match[1]);
    return octet >= 16 && octet <= 31;
  }
  return false;
}

export async function describeIpLocation(
  ip: string | null,
  storedCountry: string | null,
): Promise<string> {
  if (storedCountry) {
    return storedCountry;
  }
  if (!ip) return "Unknown";
  if (isPrivateIp(ip)) return "Local";

  const cached = cache.get(ip);
  if (cached && cached.expiresAt > Date.now()) return cached.label;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city`,
      { signal: controller.signal, cache: "no-store" },
    );
    clearTimeout(timer);
    const body = (await res.json()) as {
      status?: string;
      country?: string;
      regionName?: string;
      city?: string;
    };
    const parts = [body.city, body.regionName, body.country].filter(Boolean);
    const label =
      body.status === "success" && parts.length > 0
        ? parts.join(", ")
        : "Unknown";
    cache.set(ip, { label, expiresAt: Date.now() + TTL_MS });
    return label;
  } catch {
    cache.set(ip, { label: "Unknown", expiresAt: Date.now() + TTL_MS });
    return "Unknown";
  }
}
