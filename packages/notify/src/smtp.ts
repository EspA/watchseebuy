export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
};

export function smtpConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): SmtpConfig | null {
  const host = env.SMTP_HOST?.trim();
  if (!host) return null;
  const parsed = Number(env.SMTP_PORT ?? 587);
  const port = Number.isFinite(parsed) && parsed > 0 ? parsed : 587;
  const secure =
    env.SMTP_SECURE === "1" ||
    env.SMTP_SECURE === "true" ||
    port === 465;
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASS;
  return {
    host,
    port,
    secure,
    ...(user ? { user } : {}),
    ...(pass !== undefined && pass !== "" ? { pass } : {}),
  };
}
