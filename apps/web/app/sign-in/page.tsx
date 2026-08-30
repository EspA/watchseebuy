import { SignInForm } from "@/components/sign-in-form";
import { safeNext } from "@/lib/safe-next";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const callbackURL = safeNext(next);

  return (
    <main className="page">
      <h1>Sign in to watch</h1>
      <p className="lede">
        Search stays open. An account is only for watches and alerts.
      </p>
      <div className="panel" style={{ marginTop: 28, maxWidth: 420 }}>
        <SignInForm
          callbackURL={callbackURL}
          available={{
            google: Boolean(process.env.GOOGLE_CLIENT_ID),
            facebook: Boolean(process.env.FACEBOOK_CLIENT_ID),
            apple: Boolean(process.env.APPLE_CLIENT_ID),
          }}
        />
      </div>
    </main>
  );
}
