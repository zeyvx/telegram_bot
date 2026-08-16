import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  telegramUserId: text("telegram_user_id").notNull().unique(),
  username: varchar("username", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const communities = pgTable("communities", {
  id: uuid("id").defaultRandom().primaryKey(),
  telegramChatId: text("telegram_chat_id").notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 32 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const communityMembers = pgTable("community_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  communityId: uuid("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  level: integer("level").default(1).notNull(),
  xp: integer("xp").default(0).notNull(),
  warnings: integer("warnings").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull()
}, (table) => [
  uniqueIndex("community_members_community_user_idx").on(table.communityId, table.userId)
]);

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  communityId: uuid("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 64 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 16 }),
  color: varchar("color", { length: 32 }),
  priority: integer("priority").notNull(),
  assignable: boolean("assignable").default(true).notNull(),
  managed: boolean("managed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
  uniqueIndex("roles_community_name_idx").on(table.communityId, table.name)
]);

export const permissions = pgTable("permissions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  description: text("description").notNull()
});

export const rolePermissions = pgTable("role_permissions", {
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: varchar("permission_id", { length: 64 }).notNull().references(() => permissions.id, { onDelete: "cascade" })
}, (table) => [
  primaryKey({ columns: [table.roleId, table.permissionId] })
]);

export const memberRoles = pgTable("member_roles", {
  memberId: uuid("member_id").notNull().references(() => communityMembers.id, { onDelete: "cascade" }),
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
  assignedBy: uuid("assigned_by").references(() => users.id, { onDelete: "set null" })
}, (table) => [
  primaryKey({ columns: [table.memberId, table.roleId] })
]);

export const automations = pgTable("automations", {
  id: uuid("id").defaultRandom().primaryKey(),
  communityId: uuid("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 128 }).notNull(),
  trigger: varchar("trigger", { length: 64 }).notNull(),
  definition: jsonb("definition").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const warnings = pgTable("warnings", {
  id: uuid("id").defaultRandom().primaryKey(),
  communityId: uuid("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  memberId: uuid("member_id").notNull().references(() => communityMembers.id, { onDelete: "cascade" }),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const moderationActions = pgTable("moderation_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  communityId: uuid("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  targetMemberId: uuid("target_member_id").references(() => communityMembers.id, { onDelete: "set null" }),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 64 }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  communityId: uuid("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 128 }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const xpTransactions = pgTable("xp_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  communityId: uuid("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  memberId: uuid("member_id").notNull().references(() => communityMembers.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  reason: varchar("reason", { length: 128 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const achievements = pgTable("achievements", {
  id: uuid("id").defaultRandom().primaryKey(),
  communityId: uuid("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  definition: jsonb("definition").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const memberAchievements = pgTable("member_achievements", {
  memberId: uuid("member_id").notNull().references(() => communityMembers.id, { onDelete: "cascade" }),
  achievementId: uuid("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  awardedAt: timestamp("awarded_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
  primaryKey({ columns: [table.memberId, table.achievementId] })
]);

export const botSettings = pgTable("bot_settings", {
  communityId: uuid("community_id").primaryKey().references(() => communities.id, { onDelete: "cascade" }),
  settings: jsonb("settings").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const usersRelations = relations(users, ({ many }) => ({ members: many(communityMembers) }));
export const communitiesRelations = relations(communities, ({ many }) => ({ members: many(communityMembers), roles: many(roles), automations: many(automations) }));
