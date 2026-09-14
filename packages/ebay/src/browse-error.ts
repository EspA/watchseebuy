export const EBAY_API_ERROR_MAX = 500;

export function truncateEbayError(
  message: string,
  max = EBAY_API_ERROR_MAX,
): string {
  const trimmed = message.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max);
}

export function ebayErrorFromBody(body: unknown, httpStatus: number): string {
  if (body && typeof body === "object") {
    const rec = body as {
      errors?: Array<{ longMessage?: string; message?: string }>;
      error_description?: string;
      error?: string;
    };
    const first = rec.errors?.[0];
    const message =
      first?.longMessage ??
      first?.message ??
      rec.error_description ??
      rec.error;
    if (message) return truncateEbayError(message);
  }
  return `HTTP ${httpStatus}`;
}

export function ebayErrorFromText(body: string, httpStatus: number): string {
  const trimmed = body.trim();
  if (!trimmed) return `HTTP ${httpStatus}`;
  try {
    return ebayErrorFromBody(JSON.parse(trimmed) as unknown, httpStatus);
  } catch {
    return truncateEbayError(trimmed);
  }
}

export function ebayErrorFromThrown(error: unknown, httpStatus = 0): string {
  if (error instanceof Error && error.message) {
    return truncateEbayError(error.message);
  }
  if (error) return truncateEbayError(String(error));
  return httpStatus ? `HTTP ${httpStatus}` : "request failed";
}
