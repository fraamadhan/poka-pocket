import { pgTable, text, timestamp, integer, primaryKey, numeric } from "drizzle-orm/pg-core";
import type { AdapterAccount } from "@auth/core/adapters";

// --- NextAuth v5 Required Tables ---

export const users = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// --- Poka Pocket App Custom Tables ---

export const pockets = pgTable("pocket", {
  id: text("id").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0.00"),
  icon: text("icon").notNull().default("satchel"), // e.g. "satchel", "chest", "wallet"
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const categories = pgTable("category", {
  id: text("id").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  budgetLimit: numeric("budgetLimit", { precision: 12, scale: 2 }), // optional spending cap
  icon: text("icon").notNull().default("burger"), // e.g. "burger", "game", "scroll"
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const transactions = pgTable("transaction", {
  id: text("id").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  pocketId: text("pocketId")
    .notNull()
    .references(() => pockets.id, { onDelete: "cascade" }),
  categoryId: text("categoryId")
    .references(() => categories.id, { onDelete: "set null" }), // Category can be optional or deleted without cascading transactions
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  type: text("type").$type<"expense" | "income">().notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const feedbacks = pgTable("feedback", {
  id: text("id").notNull().primaryKey(),
  userId: text("userId")
    .references(() => users.id, { onDelete: "cascade" }), // Nullable in case of guest/unauthenticated feedback
  rating: integer("rating"), // Optional rating out of 5 stars
  message: text("message").notNull(), // Feedback content
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const exports = pgTable("export_history", {
  id: text("id").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileName: text("fileName").notNull(),
  fileUrl: text("fileUrl").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});
