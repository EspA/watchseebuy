import { getDb, isUnauthenticatedUserId, setAdminUserPlan } from "@watchseebuy/db";
import { parseAdminPlanGrant } from "@watchseebuy/domain";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  const dest = (query: string) =>
    NextResponse.redirect(new URL(`/users/${id}${query}`, request.url), 303);

  if (isUnauthenticatedUserId(id)) {
    return dest("");
  }

  const form = await request.formData();
  const grant = parseAdminPlanGrant(
    String(form.get("plan") ?? ""),
    String(form.get("interval") ?? ""),
  );
  if (!grant) {
    return dest("?plan=invalid");
  }

  await setAdminUserPlan(getDb(), id, grant);
  return dest("?plan=saved");
}
