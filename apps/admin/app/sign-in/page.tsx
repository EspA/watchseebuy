import { DEFAULT_ADMIN_EMAIL } from "@waitseebuy/domain";
import { redirect } from "next/navigation";
import { GoogleSignIn } from "@/components/google-sign-in";
import { getSession } from "@/lib/session";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/users");
  const { error } = await searchParams;
  const googleReady = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <main className="page">
      <div className="panel sign-in-card">
        <h1>Admin sign-in</h1>
        <p className="lede">
          Google only. The allowlisted mailbox is{" "}
          {process.env.ADMIN_ALLOWED_EMAIL ?? DEFAULT_ADMIN_EMAIL}.
        </p>
        {error === "forbidden" ? (
          <p className="error">That Google account is not allowed here.</p>
        ) : null}
        {googleReady ? (
          <GoogleSignIn />
        ) : (
          <p className="muted">
            Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then add the
            redirect http://localhost:3001/api/auth/callback/google.
          </p>
        )}
      </div>
    </main>
  );
}
