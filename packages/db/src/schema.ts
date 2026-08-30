import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const coverageQueries = pgTable("coverage_queries", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  keywords: text("keywords").notNull(),
  condition: text("condition").notNull(),
  ebaySite: text("ebay_site").notNull(),
  listingType: text("listing_type").notNull(),
  lastPolledAt: timestamp("last_polled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const watches = pgTable(
  "watches",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    coverageQueryId: text("coverage_query_id")
      .notNull()
      .references(() => coverageQueries.id),
    label: text("label").notNull(),
    criteria: jsonb("criteria").notNull(),
    quietHoursStart: text("quiet_hours_start"),
    quietHoursEnd: text("quiet_hours_end"),
    onlyIfDeal: integer("only_if_deal").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("watches_user_id_idx").on(t.userId),
    index("watches_coverage_query_id_idx").on(t.coverageQueryId),
    uniqueIndex("watches_user_coverage_uidx").on(t.userId, t.coverageQueryId),
  ],
);

export const listings = pgTable("listings", {
  ebayItemId: text("ebay_item_id").primaryKey(),
  title: text("title").notNull(),
  payload: jsonb("payload").notNull(),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const matches = pgTable(
  "matches",
  {
    id: text("id").primaryKey(),
    watchId: text("watch_id")
      .notNull()
      .references(() => watches.id, { onDelete: "cascade" }),
    ebayItemId: text("ebay_item_id")
      .notNull()
      .references(() => listings.ebayItemId),
    landedCents: bigint("landed_cents", { mode: "number" }).notNull(),
    compDeltaPct: integer("comp_delta_pct"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("matches_watch_listing_uidx").on(t.watchId, t.ebayItemId)],
);

export const alerts = pgTable(
  "alerts",
  {
    id: text("id").primaryKey(),
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    clickToken: text("click_token").notNull().unique(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("alerts_click_token_idx").on(t.clickToken)],
);

export const soldCompCache = pgTable("sold_comp_cache", {
  itemKey: text("item_key").primaryKey(),
  windowDays: integer("window_days").notNull(),
  medianCents: bigint("median_cents", { mode: "number" }).notNull(),
  sampleSize: integer("sample_size").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
