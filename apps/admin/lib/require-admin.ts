import { isAllowedAdminEmail } from "@waitseebuy/domain";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { getSession } from "./session";

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  if (!isAllowedAdminEmail(session.user.email)) {
    try {
      await auth.api.signOut({ headers: await headers() });
    } catch {
      // Cookie clear is best-effort; the allowlist still blocks the page.
    }
    redirect("/sign-in?error=forbidden");
  }
  return session;
}
