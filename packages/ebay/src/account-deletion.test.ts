import assert from "node:assert/strict";
import { createSign, generateKeyPairSync } from "node:crypto";
import { test } from "node:test";
import {
  ACCOUNT_DELETION_PATH,
  challengeResponse,
  defaultNotificationEndpoint,
  formatPublicKeyPem,
  notificationEndpointFromEnv,
  parseAccountDeletionPayload,
  parseEbaySignatureHeader,
  redactSellerUsernameFromPayload,
  verifyNotificationSignature,
} from "./account-deletion.ts";

const TOKEN = "watchseebuy-ebay-deletion-token-32chars";
const ENDPOINT = "https://watchseebuy.com/api/ebay/account-deletion";

test("challenge hash concatenates code, token, and exact endpoint", () => {
  const hex = challengeResponse("abc123", TOKEN, ENDPOINT);
  assert.equal(hex.length, 64);
  assert.notEqual(
    hex,
    challengeResponse("abc123", TOKEN, `${ENDPOINT}/`),
  );
});

test("default endpoint is APP_URL plus the public path", () => {
  assert.equal(
    defaultNotificationEndpoint("https://watchseebuy.com/"),
    `https://watchseebuy.com${ACCOUNT_DELETION_PATH}`,
  );
});

test("verification token must be 32-80 url-safe characters", () => {
  assert.throws(
    () =>
      notificationEndpointFromEnv({
        EBAY_NOTIFICATION_VERIFICATION_TOKEN: "too-short",
        APP_URL: "https://watchseebuy.com",
      }),
    /32-80/,
  );
  const config = notificationEndpointFromEnv({
    EBAY_NOTIFICATION_VERIFICATION_TOKEN: TOKEN,
    APP_URL: "https://watchseebuy.com/",
  });
  assert.equal(config.endpoint, ENDPOINT);
  assert.equal(config.verificationToken, TOKEN);
});

test("parses marketplace account deletion payloads", () => {
  const event = parseAccountDeletionPayload(
    JSON.stringify({
      metadata: {
        topic: "MARKETPLACE_ACCOUNT_DELETION",
        schemaVersion: "1.0",
        deprecated: false,
      },
      notification: {
        notificationId: "n-1",
        eventDate: "2021-03-19T20:43:59.462Z",
        publishDate: "2021-03-19T20:43:59.679Z",
        publishAttemptCount: 1,
        data: {
          username: "test_user",
          userId: "ma8vp1jySJC",
          eiasToken: "nY+sHZ2PrBmdj6wVnY+sEZ2PrA2dj6wJnY+gAZGEpwmdj6x9nY+seQ==",
        },
      },
    }),
  );
  assert.equal(event.notificationId, "n-1");
  assert.equal(event.username, "test_user");
  assert.equal(event.userId, "ma8vp1jySJC");
  assert.equal(event.eventDate?.toISOString(), "2021-03-19T20:43:59.462Z");
});

test("rejects a payload without a notification id", () => {
  assert.throws(
    () => parseAccountDeletionPayload(JSON.stringify({ notification: {} })),
    /notificationId/,
  );
});

test("strips matching seller username from a listing snapshot", () => {
  const redacted = redactSellerUsernameFromPayload(
    {
      ebayItemId: "1",
      title: "PSA 10 Charizard",
      sellerUsername: "Test_User",
      sellerFeedbackScore: 120,
    },
    "test_user",
  ) as Record<string, unknown>;
  assert.equal(redacted.sellerUsername, undefined);
  assert.equal(redacted.sellerFeedbackScore, 120);
  assert.equal(redacted.title, "PSA 10 Charizard");
});

test("leaves other sellers' snapshots alone", () => {
  const payload = { sellerUsername: "other_seller", title: "Keep" };
  assert.deepEqual(
    redactSellerUsernameFromPayload(payload, "test_user"),
    payload,
  );
});

test("verifies an ECDSA SHA1 signature over the raw body", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  });
  const body = JSON.stringify({ notification: { notificationId: "n-2" } });
  const signer = createSign("SHA1");
  signer.update(body);
  signer.end();
  const signature = signer.sign(privateKey, "base64");
  const pem = publicKey.export({ type: "spki", format: "pem" }).toString();
  assert.equal(
    verifyNotificationSignature({
      rawBody: body,
      signature,
      publicKeyPem: pem,
    }),
    true,
  );
  assert.equal(
    verifyNotificationSignature({
      rawBody: `${body} `,
      signature,
      publicKeyPem: pem,
    }),
    false,
  );
});

test("decodes the X-EBAY-SIGNATURE header", () => {
  const header = Buffer.from(
    JSON.stringify({
      alg: "ECDSA",
      kid: "key-1",
      signature: "abc",
      digest: "SHA1",
    }),
  ).toString("base64");
  const parsed = parseEbaySignatureHeader(header);
  assert.equal(parsed?.kid, "key-1");
  assert.equal(parsed?.signature, "abc");
  assert.equal(parseEbaySignatureHeader("not-base64-json"), null);
});

test("formats a compact public key as PEM", () => {
  const pem = formatPublicKeyPem("ABCDEF");
  assert.match(pem, /BEGIN PUBLIC KEY/);
  assert.match(pem, /ABCDEF/);
});
