import { getDb } from "@waitseebuy/db";
import { account, session, user, verification } from "@waitseebuy/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { rememberDevMagicLink } from "./dev-magic-link";

function socialProviders() {
  const providers: NonNullable<
    Parameters<typeof betterAuth>[0]
  >["socialProviders"] = {};

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }
  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    providers.facebook = {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
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
  socialProviders: socialProviders(),
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "facebook", "apple"],
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        if (process.env.RESEND_API_KEY) {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM ?? "WaitSeeBuy <noreply@waitseebuy.com>",
              to: email,
              subject: "Your WaitSeeBuy sign-in link",
              text: `Wait. See. Buy.\n\nSign in: ${url}\n`,
            }),
          });
          if (!res.ok) {
            throw new Error(`Resend failed: ${await res.text()}`);
          }
          return;
        }
        rememberDevMagicLink(email, url);
        console.log(`[waitseebuy] magic link for ${email}: ${url}`);
      },
    }),
    nextCookies(),
  ],
});
