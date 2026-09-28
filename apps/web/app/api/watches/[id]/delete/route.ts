import { deleteWatchForUser, getDb } from "@watchseebuy/db";
import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/absolute-url";
import { getSession } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(absoluteUrl("/sign-in", request), 303);
  }

  const { id } = await params;
  await deleteWatchForUser(getDb(), {
    userId: session.user.id,
    watchId: id,
  });

  return NextResponse.redirect(absoluteUrl("/watches", request), 303);
}
