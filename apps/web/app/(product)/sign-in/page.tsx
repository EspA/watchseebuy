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
    <main className="page sign-in-page">
      <div className="panel sign-in-card">
        <h1>Sign in to watch</h1>
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
