import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Enums

export const planEnum = pgEnum("plan", ["harbor", "voyage", "fleet", "lighthouse"]);
export const workspaceTypeEnum = pgEnum("workspace_type", ["seller", "partner_client"]);
export const passportStatusEnum = pgEnum("passport_status", ["draft", "complete"]);
export const requirementStatusEnum = pgEnum("requirement_status", ["todo", "done", "unsure", "na"]);
export const alertChannelEnum = pgEnum("alert_channel", ["email", "telegram", "in_app"]);
export const alertFeedbackEnum = pgEnum("alert_feedback", ["up", "down"]);
export const newsletterStatusEnum = pgEnum("newsletter_status", ["drafted", "approved", "sent", "skipped"]);
export const feedbackKindEnum = pgEnum("feedback_kind", ["nps", "alert", "assistant", "cancel", "feature"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "ai_drafted", "auto_resolved", "resolved", "escalated"]);
export const sourceStatusEnum = pgEnum("source_status", ["ok", "degraded", "down", "paused"]);
export const severityEnum = pgEnum("severity", ["low", "medium", "high"]);

// Core tables (master-plan §9.3)

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  /** Required by the Auth.js Drizzle adapter. */
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  telegramChatId: text("telegram_chat_id"),
  plan: planEnum("plan").notNull().default("harbor"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubId: text("stripe_sub_id"),
  /** Mirrors Stripe so the UI can explain a lapsed or past-due subscription. */
  stripeStatus: text("stripe_status"),
  planRenewsAt: timestamp("plan_renews_at", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  utmFirstTouch: jsonb("utm_first_touch"),
  locale: text("locale").notNull().default("en"),
  streakWeeks: integer("streak_weeks").notNull().default(0),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Auth.js tables (shapes fixed by @auth/drizzle-adapter) ---

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: workspaceTypeEnum("type").notNull().default("seller"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
    name: text("name").notNull(),
    description: text("description"),
    listingUrl: text("listing_url"),
    imageUrl: text("image_url"),
    materials: jsonb("materials").$type<string[]>(),
    audience: text("audience"), // kids | adults | both
    /** under_3 | 3_to_12 | 13_plus | not_for_children - null when not asked. */
    ageBand: text("age_band"),
    hasBattery: boolean("has_battery"),
    hasPlug: boolean("has_plug"),
    /**
     * Null means "not asked yet", not "no". The cross-reference engine treats an
     * unanswered attribute as unresolved and still surfaces the rule, so a
     * critical requirement is never hidden by a question we skipped.
     */
    hasButtonCell: boolean("has_button_cell"),
    isToy: boolean("is_toy"),
    hasRadio: boolean("has_radio"),
    isDigitalDevice: boolean("is_digital_device"),
    originCountry: text("origin_country"),
    annualImportValue: integer("annual_import_value"),
    htsCode: text("hts_code"),
    htsConfidence: real("hts_confidence"),
    passportStatus: passportStatusEnum("passport_status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("products_workspace_idx").on(t.workspaceId), index("products_hts_idx").on(t.htsCode)],
);

export const requirements = pgTable("requirements", {
  id: text("id").primaryKey(),
  categoryKey: text("category_key").notNull(),
  agency: text("agency").notNull(),
  title: text("title").notNull(),
  plainEnglish: text("plain_english").notNull(),
  sourceUrl: text("source_url").notNull(),
  severity: severityEnum("severity").notNull().default("medium"),
  version: integer("version").notNull().default(1),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }),
  supersededBy: text("superseded_by"),
});

export const productRequirements = pgTable(
  "product_requirements",
  {
    productId: text("product_id").notNull().references(() => products.id),
    requirementId: text("requirement_id").notNull().references(() => requirements.id),
    status: requirementStatusEnum("status").notNull().default("todo"),
  },
  (t) => [primaryKey({ columns: [t.productId, t.requirementId] })],
);

// Append-only duty history
export const tariffLines = pgTable(
  "tariff_lines",
  {
    id: text("id").primaryKey(),
    htsCode: text("hts_code").notNull(),
    baseRate: numeric("base_rate"),
    s301Rate: numeric("s301_rate"),
    otherRates: jsonb("other_rates"),
    totalRate: numeric("total_rate"),
    effectiveDate: timestamp("effective_date", { withTimezone: true }),
    sourceDocId: text("source_doc_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tariff_lines_hts_idx").on(t.htsCode)],
);

export const sourceDocs = pgTable(
  "source_docs",
  {
    id: text("id").primaryKey(),
    source: text("source").notNull(), // federal_register | usitc_hts | cbp_csms | lawfirm_rss
    externalId: text("external_id").notNull(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    raw: jsonb("raw"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("source_docs_source_external_idx").on(t.source, t.externalId)],
);

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // duty_change | new_rule | proposed_rule | notice
  sourceDocId: text("source_doc_id").references(() => sourceDocs.id),
  affectedHts: text("affected_hts").array(),
  affectedCategories: text("affected_categories").array(),
  summary: text("summary").notNull(),
  dollarImpactFormula: text("dollar_impact_formula"),
  effectiveDate: timestamp("effective_date", { withTimezone: true }),
  confidence: real("confidence").notNull(),
  reviewedBy: text("reviewed_by"), // set when a low-confidence event is human-approved
  /**
   * Set when a human decided this must never be sent.
   *
   * A separate column rather than a marker inside reviewed_by: isSendable()
   * treats any reviewer as an approval, so encoding "rejected" in that field
   * made rejection *enable* sending.
   */
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const alerts = pgTable(
  "alerts",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id").notNull().references(() => events.id),
    userId: text("user_id").notNull().references(() => users.id),
    productId: text("product_id").notNull().references(() => products.id),
    channel: alertChannelEnum("channel").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    feedback: alertFeedbackEnum("feedback"),
    feedbackNote: text("feedback_note"),
  },
  (t) => [uniqueIndex("alerts_dedupe_idx").on(t.eventId, t.userId, t.productId, t.channel)],
);

export const watchTypeEnum = pgEnum("watch_type", [
  "hts_duty",
  "origin_tariff",
  "agency_requirement",
  "recall",
  "adcvd",
]);

/**
 * What a seller chose to be alerted about, after reviewing the candidates the
 * cross-reference engine offered when their Passport completed. Nothing is
 * watched unless it appears here - we never subscribe anyone silently.
 */
export const productWatches = pgTable(
  "product_watches",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    type: watchTypeEnum("type").notNull(),
    /** The thing being watched: an HTS prefix, an origin country, a category key. */
    watchKey: text("watch_key").notNull(),
    label: text("label").notNull(),
    /** Snapshot of the sources shown when the seller opted in - an audit trail. */
    sources: jsonb("sources").$type<Array<{ title: string; url: string }>>(),
    confidence: real("confidence"),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("product_watches_unique_idx").on(t.productId, t.type, t.watchKey),
    index("product_watches_lookup_idx").on(t.type, t.watchKey),
  ],
);

export const assistantThreads = pgTable("assistant_threads", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  messages: jsonb("messages").notNull(),
  escalated: boolean("escalated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const newsletterIssues = pgTable("newsletter_issues", {
  id: text("id").primaryKey(),
  weekOf: timestamp("week_of", { withTimezone: true }).notNull(),
  draftMd: text("draft_md"),
  html: text("html"),
  status: newsletterStatusEnum("status").notNull().default("drafted"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  stats: jsonb("stats"),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  source: text("source"),
  confirmToken: text("confirm_token"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  /**
   * Join order on the pre-launch waitlist, from the `waitlist_position_seq`
   * sequence so concurrent signups can never collide. Positions 1..FOUNDING_SPOTS
   * earn the founding-member discount. Null for people who arrived another way.
   */
  waitlistPosition: integer("waitlist_position").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feedback = pgTable("feedback", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  kind: feedbackKindEnum("kind").notNull(),
  score: integer("score"),
  text: text("text"),
  context: jsonb("context"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const supportTickets = pgTable("support_tickets", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  channel: text("channel").notNull(), // email | assistant
  body: text("body").notNull(),
  aiDraft: text("ai_draft"),
  aiConfidence: real("ai_confidence"),
  status: ticketStatusEnum("status").notNull().default("open"),
  resolvedBy: text("resolved_by"), // ai | human
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const badges = pgTable(
  "badges",
  {
    userId: text("user_id").notNull().references(() => users.id),
    key: text("key").notNull(), // first_catch | fleet_of_10 | early_bird | founding_voyager
    earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.key] })],
);

export const sourceHealth = pgTable("source_health", {
  source: text("source").primaryKey(),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
  errorStreak: integer("error_streak").notNull().default(0),
  status: sourceStatusEnum("status").notNull().default("ok"),
});

export const affiliates = pgTable("affiliates", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  code: text("code").notNull().unique(),
  rate: real("rate").notNull().default(0.25),
  earnings: numeric("earnings").notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminAudit = pgTable("admin_audit", {
  id: text("id").primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  target: text("target"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});
