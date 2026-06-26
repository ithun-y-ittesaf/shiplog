// Mirrors packages/core/src/types.ts almost 1:1 -- the DB schema is just
// the persisted form of the domain model, nothing more.
import { pgTable, uuid, text, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const triggerEvents = pgTable("trigger_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  type: text("type").notNull(),
  sourceRef: text("source_ref").notNull(),
  raw: jsonb("raw"),
  firedAt: timestamp("fired_at").defaultNow().notNull(),
});

export const contentItems = pgTable("content_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  triggerEventId: uuid("trigger_event_id").notNull().references(() => triggerEvents.id),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  link: text("link"),
  include: boolean("include").default(true).notNull(),
  audience: text("audience"),
});

// The configurability surface, persisted. A team edits rows here (via UI,
// eventually) instead of you shipping code changes for their process.
export const mappingRules = pgTable("mapping_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  match: jsonb("match").notNull(),
  action: jsonb("action").notNull(),
});

export const destinations = pgTable("destinations", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  type: text("type").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  template: text("template").notNull(),
  settings: jsonb("settings").default({}).notNull(),
});

export const shipmentRuns = pgTable("shipment_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  triggerEventId: uuid("trigger_event_id").notNull().references(() => triggerEvents.id),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
  results: jsonb("results").default([]).notNull(),
});
