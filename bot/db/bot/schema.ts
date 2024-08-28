import {
	bigint,
	integer,
	pgSchema,
	timestamp,
	real,
	serial,
	text,
} from "drizzle-orm/pg-core";

export const schema = pgSchema("bot");

export const chatSubscription = schema.table("chatSubscription", {
	id: serial("id").primaryKey(),
	chatId: bigint("chatId", { mode: "bigint" }).notNull(),
	silo: text("silo").notNull(),
	account: text("account").notNull(),
	chainId: integer("chainId").notNull(),
	creator: text("creator").notNull(),
	notificationThreshold: real("notificationThreshold").notNull(),
	paused: integer("paused").notNull(),
	language: text("language").notNull(),
	chatTitle: text("chatTitle").notNull(),
	coolDownSeconds: integer("coolDownSeconds").default(60).notNull(),
	lastNotifiedAt: timestamp("lastNotifiedAt"),
});

export const accountHealthFactor = schema.table("accountHealthFactor", {
	id: text("id").primaryKey(),
	chainId: integer("chainId").notNull(),
	account: text("account").notNull(),
	silo: text("silo").notNull(),
	healthFactor: real("healthFactor").notNull(),
	currentLiquidationThreshold: bigint("currentLiquidationThreshold", {
		mode: "number",
	}).notNull(),
	currentLtv: bigint("currentLtv", { mode: "number" }).notNull(),
	block: bigint("block", { mode: "number" }).notNull(),
});
