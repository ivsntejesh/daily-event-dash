import { pgTable, text, serial, integer, boolean, uuid, timestamp, date, time, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const appRoleEnum = pgEnum("app_role", ["admin", "moderator", "user"]);
export const syncStatusEnum = pgEnum("sync_status", ["pending", "success", "failed", "skipped"]);

// Users table - keep simple for auth
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// User roles table
export const userRoles = pgTable("user_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: appRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Private events table
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isOnline: boolean("is_online").notNull().default(false),
  meetingLink: text("meeting_link"),
  location: text("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Public events table
export const publicEvents = pgTable("public_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isOnline: boolean("is_online").notNull().default(false),
  meetingLink: text("meeting_link"),
  location: text("location"),
  notes: text("notes"),
  sheetId: text("sheet_id"),
  sheetRowIndex: integer("sheet_row_index"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Private tasks table
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  isCompleted: boolean("is_completed").notNull().default(false),
  priority: text("priority").default("medium"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Public tasks table
export const publicTasks = pgTable("public_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  isCompleted: boolean("is_completed").notNull().default(false),
  priority: text("priority").default("medium"),
  notes: text("notes"),
  sheetId: text("sheet_id"),
  sheetRowIndex: integer("sheet_row_index"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Sync log table
export const syncLog = pgTable("sync_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  syncType: text("sync_type").notNull(),
  status: syncStatusEnum("status").notNull().default("pending"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  itemsProcessed: integer("items_processed").default(0),
  itemsCreated: integer("items_created").default(0),
  itemsUpdated: integer("items_updated").default(0),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPublicEventSchema = createInsertSchema(publicEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPublicTaskSchema = createInsertSchema(publicTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertPublicEvent = z.infer<typeof insertPublicEventSchema>;
export type PublicEvent = typeof publicEvents.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertPublicTask = z.infer<typeof insertPublicTaskSchema>;
export type PublicTask = typeof publicTasks.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type SyncLog = typeof syncLog.$inferSelect;
