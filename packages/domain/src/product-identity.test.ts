import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cardItemKey,
  parseCollectibleFromText,
  resolveProductIdentity,
} from "./product-identity.ts";

test("ePID is the strongest key and keeps grade off the catalog product", () => {
  const raw = resolveProductIdentity({
    title: "LEGO Millennium Falcon 75192",
    epid: "15032",
  });
  assert.equal(raw.itemKey, "epid|15032");
  assert.equal(raw.source, "epid");
  assert.equal(raw.confidence, "high");

  const graded = resolveProductIdentity({
    title: "PSA 10 1986 Fleer Michael Jordan #57",
    epid: "2601234",
  });
  assert.equal(graded.itemKey, "epid|2601234|psa|10");
  assert.equal(graded.confidence, "high");
});

test("GTIN and brand+MPN beat title parsing", () => {
  const gtin = resolveProductIdentity({
    title: "Random seller title",
    gtin: "673419265123",
  });
  assert.equal(gtin.itemKey, "gtin|673419265123");
  assert.equal(gtin.source, "gtin");
  assert.equal(gtin.confidence, "high");

  const mpn = resolveProductIdentity({
    title: "Falcon",
    brand: "LEGO",
    mpn: "75192",
  });
  assert.equal(mpn.itemKey, "mpn|lego|75192");
  assert.equal(mpn.source, "mpn");
});

test("MPN without brand is not a catalog key", () => {
  const identity = resolveProductIdentity({
    title: "Some toy 75192",
    mpn: "75192",
  });
  assert.notEqual(identity.source, "mpn");
});

test("card aspects plus grade descriptors build a collectible key", () => {
  const identity = resolveProductIdentity({
    title: "Charizard holo",
    localizedAspects: [
      { name: "Set", value: "Base Set" },
      { name: "Character", value: "Charizard" },
      { name: "Card Number", value: "4/102" },
      { name: "Language", value: "English" },
      { name: "Feature", value: "1st Edition" },
    ],
    conditionDescriptors: [
      { name: "Professional Grader", values: ["Professional Sports Authenticator (PSA)"] },
      { name: "Grade", values: ["10"] },
      { name: "Certification Number", values: [], additionalInfo: "12345678" },
    ],
  });
  assert.equal(
    identity.itemKey,
    cardItemKey({
      set: "Base Set",
      subject: "Charizard",
      cardNumber: "4/102",
      language: "English",
      variation: "1st Edition",
      company: "psa",
      grade: "10",
    }),
  );
  assert.ok(!identity.itemKey.includes("12345678"));
  assert.equal(identity.source, "aspects");
  assert.equal(identity.confidence, "high");
});

test("cert number is never part of the comparable key", () => {
  const identity = resolveProductIdentity({
    title: "PSA 10 cert 99887766 Charizard 4/102 Base Set",
    conditionDescriptors: [
      { name: "27503", additionalInfo: "99887766" },
    ],
  });
  assert.ok(!identity.itemKey.includes("99887766"));
});

test("title parse for a graded sports card", () => {
  const parsed = parseCollectibleFromText(
    "PSA 10 1986 Fleer Michael Jordan #57",
  );
  assert.equal(parsed.company, "psa");
  assert.equal(parsed.grade, "10");
  assert.equal(parsed.year, "1986");
  assert.equal(parsed.set?.toLowerCase(), "fleer");
  assert.equal(parsed.cardNumber, "57");
  assert.match(parsed.subject ?? "", /jordan/);

  const identity = resolveProductIdentity({
    title: "PSA 10 1986 Fleer Michael Jordan #57",
  });
  assert.equal(identity.source, "title");
  assert.ok(identity.confidence === "medium" || identity.confidence === "low");
  assert.match(identity.itemKey, /psa\|10$/);
});

test("title parse for a raw pokemon card keeps language and set", () => {
  const identity = resolveProductIdentity({
    title: "Charizard 4/102 1st Edition Base Set Holo English Pokemon",
  });
  assert.equal(identity.source, "title");
  assert.match(identity.itemKey, /^card\|/);
  assert.match(identity.itemKey, /base-set/);
  assert.match(identity.itemKey, /charizard/);
  assert.match(identity.itemKey, /4-102/);
  assert.match(identity.itemKey, /english/);
});

test("Lego set number from title becomes a medium-confidence key", () => {
  const identity = resolveProductIdentity({
    title: "LEGO Star Wars 75192 Millennium Falcon sealed",
  });
  assert.equal(identity.itemKey, "lego|75192|sealed");
  assert.equal(identity.source, "title");
  assert.equal(identity.confidence, "medium");
});

test("weak titles stay low confidence and do not invent a catalog id", () => {
  const identity = resolveProductIdentity({ title: "Wow deal look" });
  assert.equal(identity.confidence, "low");
  assert.equal(identity.source, "title");
  assert.match(identity.itemKey, /^title\|/);
});
