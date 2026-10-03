import { eq } from "drizzle-orm";
import type { Database } from "./client";
import { account, user } from "./schema";

export type UserSettings = {
  id: string;
  email: string;
  shipToPostal: string | null;
  timezone: string | null;
  theme: string | null;
  ebaySite: string | null;
  locale: string | null;
};

export type UserAuthSummary = {
  providerIds: string[];
  hasPassword: boolean;
};

export async function getUserMailProfile(
  db: Database,
  userId: string,
): Promise<{
  email: string;
  firstName: string | null;
  timezone: string | null;
} | null> {
  const [row] = await db
    .select({
      email: user.email,
      firstName: user.firstName,
      timezone: user.timezone,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return row ?? null;
}

export async function getUserSettings(
  db: Database,
  userId: string,
): Promise<UserSettings | null> {
  const [row] = await db
    .select({
      id: user.id,
      email: user.email,
      shipToPostal: user.shipToPostal,
      timezone: user.timezone,
      theme: user.theme,
      ebaySite: user.ebaySite,
      locale: user.locale,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return row ?? null;
}

export async function updateUserSettings(
  db: Database,
  input: {
    userId: string;
    shipToPostal?: string | null;
    timezone?: string | null;
    theme?: string | null;
    ebaySite?: string | null;
    locale?: string | null;
  },
) {
  const patch: {
    shipToPostal?: string | null;
    timezone?: string | null;
    theme?: string | null;
    ebaySite?: string | null;
    locale?: string | null;
    updatedAt: Date;
  } = { updatedAt: new Date() };
  if (input.shipToPostal !== undefined) patch.shipToPostal = input.shipToPostal;
  if (input.timezone !== undefined) patch.timezone = input.timezone;
  if (input.theme !== undefined) patch.theme = input.theme;
  if (input.ebaySite !== undefined) patch.ebaySite = input.ebaySite;
  if (input.locale !== undefined) patch.locale = input.locale;

  const [updated] = await db
    .update(user)
    .set(patch)
    .where(eq(user.id, input.userId))
    .returning({
      id: user.id,
      email: user.email,
      shipToPostal: user.shipToPostal,
      timezone: user.timezone,
      theme: user.theme,
      ebaySite: user.ebaySite,
      locale: user.locale,
    });
  return updated ?? null;
}

export async function getUserAuthSummary(
  db: Database,
  userId: string,
): Promise<UserAuthSummary> {
  const rows = await db
    .select({
      providerId: account.providerId,
      password: account.password,
    })
    .from(account)
    .where(eq(account.userId, userId));

  return {
    providerIds: rows.map((row) => row.providerId),
    hasPassword: rows.some(
      (row) => row.providerId === "credential" && Boolean(row.password),
    ),
  };
}
