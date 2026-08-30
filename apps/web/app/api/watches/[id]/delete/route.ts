import { deleteWatchForUser, getDb } from "@waitseebuy/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url), 303);
  }

  const { id } = await params;
  await deleteWatchForUser(getDb(), {
    userId: session.user.id,
    watchId: id,
  });

  return NextResponse.redirect(new URL("/watches", request.url), 303);
}
