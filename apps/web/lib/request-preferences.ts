import { cookies, headers } from "next/headers";
import type { UserSettings } from "@watchseebuy/db";
import {
  preferencesFromRequest,
  type ResolvedPreferences,
} from "@/lib/locale";

export async function getRequestPreferences(input?: {
  urlSite?: string | null;
  settings?: UserSettings | null;
}): Promise<ResolvedPreferences> {
  const headerList = await headers();
  const cookieStore = await cookies();
  return preferencesFromRequest(headerList, cookieStore, {
    urlSite: input?.urlSite,
    accountSite: input?.settings?.ebaySite,
    accountLocale: input?.settings?.locale,
  });
}
