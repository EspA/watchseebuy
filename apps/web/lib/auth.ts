import { getDb, recordConsumerLogin } from "@watchseebuy/db";
import { account, session, user, verification } from "@watchseebuy/db/schema";
import { splitDisplayName } from "@watchseebuy/domain";
import { sendTransactionalEmail, type EmailKind } from "@watchseebuy/notify";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { rememberDevMagicLink } from "./dev-magic-link";
import { consumerUserFields } from "./user-fields";

async function sendAuthEmail(input: {
  to: string;
  subject: string;
  text: string;
  url: string;
  kind: EmailKind;
}) {
  rememberDevMagicLink(input.to, input.url);
  const sent = await sendTransactionalEmail({
    to: input.to,
    subject: input.subject,
    text: input.text,
    kind: input.kind,
  });
  if (!sent.delivered) {
    console.log(`[watchseebuy] ${input.subject} for ${input.to}: ${input.url}`);
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

function socialProviders() {
  const providers: NonNullable<
    Parameters<typeof betterAuth>[0]
  >["socialProviders"] = {};

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      mapProfileToUser: (profile) => ({
        name: profile.name,
        ...namesFromProfile({
          firstName: profile.given_name,
          lastName: profile.family_name,
          name: profile.name,
        }),
      }),
    };
  }
  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    providers.facebook = {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      mapProfileToUser: (profile) => ({
        name: profile.name,
        ...namesFromProfile({
          name: profile.name,
        }),
      }),
    };
  }
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
    providers.apple = {
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    };
  }

  return providers;
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  user: {
    additionalFields: consumerUserFields,
  },
  socialProviders: socialProviders(),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user: target, url }) => {
      await sendAuthEmail({
        to: target.email,
        subject: "Reset your WatchSeeBuy password",
        text: `Watch. See. Buy.\n\nReset your password: ${url}\n`,
        url,
        kind: "password_reset",
      });
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "facebook", "apple"],
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (created) => {
          const names = namesFromProfile({
            firstName:
              "firstName" in created && typeof created.firstName === "string"
                ? created.firstName
                : undefined,
            lastName:
              "lastName" in created && typeof created.lastName === "string"
                ? created.lastName
                : undefined,
            name: created.name,
          });
          return { data: { ...created, ...names } };
        },
      },
    },
    session: {
      create: {
        after: async (created) => {
          try {
            await recordConsumerLogin(getDb(), {
              userId: created.userId,
              ...(created.ipAddress ? { ip: created.ipAddress } : {}),
            });
          } catch (error) {
            console.error(
              JSON.stringify({
                at: new Date().toISOString(),
                message: "consumer login telemetry failed",
                error: error instanceof Error ? error.message : String(error),
              }),
            );
          }
        },
      },
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendAuthEmail({
          to: email,
          subject: "Your WatchSeeBuy sign-in link",
          text: `Watch. See. Buy.\n\nSign in: ${url}\n`,
          url,
          kind: "magic_link",
        });
      },
    }),
    nextCookies(),
  ],
});
