import { getDb } from "@watchseebuy/db";
import { account, session, user, verification } from "@watchseebuy/db/schema";
import { isAllowedAdminEmail, splitDisplayName } from "@watchseebuy/domain";
import { eq } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { ADMIN_COOKIE_PREFIX } from "./cookies";
import { consumerUserFields } from "./user-fields";

function assertAdminEmail(email: string | undefined) {
  if (!email || !isAllowedAdminEmail(email)) {
    throw new APIError("FORBIDDEN", {
      message: "This account is not allowed to use admin.",
    });
  }
}

function namesFromProfile(input: {
  firstName?: string;
  lastName?: string;
  name?: string;
}) {
  const split = splitDisplayName(input.name ?? "");
  const firstName = input.firstName?.trim() || split.firstName;
  const lastName = input.lastName?.trim() || split.lastName;
  return {
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
  };
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.ADMIN_BETTER_AUTH_URL ?? "http://localhost:3001",
  advanced: {
    cookiePrefix: ADMIN_COOKIE_PREFIX,
  },
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  user: {
    additionalFields: consumerUserFields,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            mapProfileToUser: (profile) => {
              assertAdminEmail(profile.email);
              return {
                name: profile.name,
                ...namesFromProfile({
                  firstName: profile.given_name,
                  lastName: profile.family_name,
                  name: profile.name,
                }),
              };
            },
          },
        }
      : {}),
  },
  emailAndPassword: {
    enabled: false,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (created) => {
          assertAdminEmail(created.email);
          return { data: created };
        },
      },
    },
    session: {
      create: {
        before: async (created) => {
          const [row] = await getDb()
            .select({ email: user.email })
            .from(user)
            .where(eq(user.id, created.userId))
            .limit(1);
          assertAdminEmail(row?.email);
          return { data: created };
        },
      },
    },
  },
  plugins: [nextCookies()],
});
