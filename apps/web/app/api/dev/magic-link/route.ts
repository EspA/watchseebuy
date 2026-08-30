import { NextResponse } from "next/server";
import { peekDevMagicLink } from "@/lib/dev-magic-link";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(peekDevMagicLink() ?? {});
}
