import {
  bigint,
  boolean,
  date,
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
  firstName: text("first_name"),
  lastName: text("last_name"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  lastIp: text("last_ip"),
  lastCountry: text("last_country"),
  loginCount: integer("login_count").notNull().default(0),
  searchCount: integer("search_count").notNull().default(0),
  buyClickCount: integer("buy_click_count").notNull().default(0),
  shipToPostal: text("ship_to_postal"),
  timezone: text("timezone"),
  theme: text("theme"),
  ebaySite: text("ebay_site"),
  locale: text("locale"),
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
  (t) => [
    index("session_user_id_idx").on(t.userId),
    index("session_expires_at_idx").on(t.expiresAt),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    issuer: text("issuer").notNull(),
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
  (t) => [
    index("account_user_id_idx").on(t.userId),
    uniqueIndex("account_issuer_account_id_uidx").on(t.issuer, t.accountId),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("verification_expires_at_idx").on(t.expiresAt)],
);

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
    alertFrequency: text("alert_frequency").notNull().default("on_change"),
    lastAlertedAt: timestamp("last_alerted_at", { withTimezone: true }),
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

export const listings = pgTable(
  "listings",
  {
    ebayItemId: text("ebay_item_id").primaryKey(),
    title: text("title").notNull(),
    payload: jsonb("payload").notNull(),
    sellerUsername: text("seller_username"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("listings_seller_username_idx").on(t.sellerUsername)],
);

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
    alertedAt: timestamp("alerted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("matches_watch_listing_uidx").on(t.watchId, t.ebayItemId),
    index("matches_created_at_idx").on(t.createdAt),
    index("matches_alerted_at_idx").on(t.alertedAt),
  ],
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
  (t) => [
    index("alerts_click_token_idx").on(t.clickToken),
    index("alerts_sent_at_idx").on(t.sentAt),
  ],
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

export const ebayApiCalls = pgTable(
  "ebay_api_calls",
  {
    id: text("id").primaryKey(),
    calledAt: timestamp("called_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    api: text("api").notNull(),
    source: text("source").notNull(),
    ok: boolean("ok").notNull(),
    httpStatus: integer("http_status"),
    durationMs: integer("duration_ms").notNull(),
    error: text("error"),
  },
  (t) => [
    index("ebay_api_calls_called_at_idx").on(t.calledAt),
    index("ebay_api_calls_api_called_at_idx").on(t.api, t.calledAt),
    index("ebay_api_calls_ok_called_at_idx").on(t.ok, t.calledAt),
  ],
);

export const emailSends = pgTable(
  "email_sends",
  {
    id: text("id").primaryKey(),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    kind: text("kind").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    status: text("status").notNull(),
    ok: boolean("ok").notNull(),
    error: text("error"),
  },
  (t) => [
    index("email_sends_sent_at_idx").on(t.sentAt),
    index("email_sends_kind_sent_at_idx").on(t.kind, t.sentAt),
  ],
);

export const userEvents = pgTable(
  "user_events",
  {
    id: text("id").primaryKey(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    kind: text("kind").notNull(),
    ip: text("ip"),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
  },
  (t) => [
    index("user_events_kind_occurred_at_idx").on(t.kind, t.occurredAt),
    index("user_events_user_id_kind_idx").on(t.userId, t.kind),
    index("user_events_occurred_at_idx").on(t.occurredAt),
  ],
);

export const ebayApiDaily = pgTable(
  "ebay_api_daily",
  {
    day: date("day").notNull(),
    api: text("api").notNull(),
    source: text("source").notNull(),
    total: integer("total").notNull(),
    success: integer("success").notNull(),
    failure: integer("failure").notNull(),
    rateLimited: integer("rate_limited").notNull(),
  },
  (t) => [
    uniqueIndex("ebay_api_daily_day_api_source_uidx").on(t.day, t.api, t.source),
  ],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    plan: text("plan").notNull(),
    billingInterval: text("billing_interval"),
    status: text("status").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    paypalSubscriptionId: text("paypal_subscription_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("subscriptions_paypal_subscription_id_uidx").on(
      t.paypalSubscriptionId,
    ),
  ],
);

export const paypalCatalog = pgTable("paypal_catalog", {
  key: text("key").primaryKey(),
  paypalId: text("paypal_id").notNull(),
});

export const agentSearchQuota = pgTable("agent_search_quota", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const maintenanceRuns = pgTable("maintenance_runs", {
  job: text("job").primaryKey(),
  lastRanAt: timestamp("last_ran_at", { withTimezone: true }).notNull(),
});

export const ebayAccountDeletions = pgTable(
  "ebay_account_deletions",
  {
    id: text("id").primaryKey(),
    notificationId: text("notification_id").notNull().unique(),
    topic: text("topic").notNull(),
    username: text("username"),
    ebayUserId: text("ebay_user_id"),
    eventDate: timestamp("event_date", { withTimezone: true }),
    listingsRedacted: integer("listings_redacted").notNull().default(0),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("ebay_account_deletions_received_at_idx").on(t.receivedAt)],
);
