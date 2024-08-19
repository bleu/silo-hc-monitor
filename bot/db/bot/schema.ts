import { type SQL, sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	bigint,
	boolean,
	integer,
	pgSchema,
	pgTable,
	real,
	serial,
	text,
} from "drizzle-orm/pg-core";

export const schema = pgSchema("bot");

export const chatSubscription = schema.table("chatSubscription", {
	id: serial("id").primaryKey(),
	chatId: integer("chatId").notNull(),
	silo: text("silo").notNull(),
	account: text("account").notNull(),
	chainId: integer("chainId").notNull(),
	creator: text("creator").notNull(),
	notificationThreshold: real("notificationThreshold").notNull(),
	paused: integer("paused").notNull(),
	language: text("language").notNull(),
	chatTitle: text("chatTitle").notNull(),
});
