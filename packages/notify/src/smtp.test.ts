import assert from "node:assert/strict";
import { test } from "node:test";
import { smtpConfigFromEnv } from "./smtp.ts";

test("missing SMTP_HOST means do not send", () => {
  assert.equal(smtpConfigFromEnv({}), null);
  assert.equal(smtpConfigFromEnv({ SMTP_HOST: "  " }), null);
});

test("Mailpit local defaults", () => {
  assert.deepEqual(
    smtpConfigFromEnv({ SMTP_HOST: "127.0.0.1", SMTP_PORT: "1025" }),
    { host: "127.0.0.1", port: 1025, secure: false },
  );
});

test("submission port 465 implies TLS", () => {
  const config = smtpConfigFromEnv({
    SMTP_HOST: "smtp.example.com",
    SMTP_PORT: "465",
    SMTP_USER: "alerts",
    SMTP_PASS: "secret",
  });
  assert.deepEqual(config, {
    host: "smtp.example.com",
    port: 465,
    secure: true,
    user: "alerts",
    pass: "secret",
  });
});
