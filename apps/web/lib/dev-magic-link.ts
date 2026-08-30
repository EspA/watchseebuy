import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const file = join(process.cwd(), ".next", "dev-magic-link.json");

type Stored = { email: string; url: string };

export function rememberDevMagicLink(email: string, url: string) {
  if (process.env.NODE_ENV === "production") return;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ email, url } satisfies Stored));
}

export function peekDevMagicLink(): Stored | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as Stored;
  } catch {
    return undefined;
  }
}
