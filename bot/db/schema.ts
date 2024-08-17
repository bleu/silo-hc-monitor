import { type SQL, sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	bigint,
	boolean,
	integer,
	pgTable,
	real,
	text,
} from "drizzle-orm/pg-core";

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	chainId: integer("chainId").notNull(),
});

export const silo = pgTable("silo", {
	id: text("id").primaryKey(),
	address: text("address").notNull(),
	chainId: integer("chainId").notNull(),
	asset: text("asset").notNull(),
	assetSymbol: text("assetSymbol"),
});

export const borrow = pgTable("borrow", {
	id: text("id").primaryKey(),
	chainId: integer("chainId").notNull(),
	account: text("account").notNull(),
	silo: text("silo").notNull(),
	amount: bigint("amount", { mode: "number" }).notNull(),
});

export const repay = pgTable("repay", {
	id: text("id").primaryKey(),
	chainId: integer("chainId").notNull(),
	account: text("account").notNull(),
	silo: text("silo").notNull(),
	amount: bigint("amount", { mode: "number" }).notNull(),
});

export const position = pgTable("position", {
	id: text("id").primaryKey(),
	chainId: integer("chainId").notNull(),
	account: text("account").notNull(),
	silo: text("silo").notNull(),
	balance: bigint("balance", { mode: "number" }).notNull(),
});

export const token = pgTable("token", {
	id: text("id").primaryKey(),
	chainId: integer("chainId").notNull(),
	name: text("name").notNull(),
	symbol: text("symbol").notNull(),
	decimals: integer("decimals").notNull(),
});

export const accountHealthFactor = pgTable("accountHealthFactor", {
	id: text("id").primaryKey(),
	chainId: integer("chainId").notNull(),
	account: text("account").notNull(),
	healthFactor: real("healthFactor").notNull(),
	currentLiquidationThreshold: bigint("currentLiquidationThreshold", {
		mode: "number",
	}).notNull(),
	currentLtv: bigint("currentLtv", { mode: "number" }).notNull(),
	block: bigint("block", { mode: "number" }).notNull(),
	blockTimestamp: bigint("blockTimestamp", { mode: "number" }).notNull(),
});

export const chatSubscription = pgTable("chatSubscription", {
	id: text("id").primaryKey(),
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

export function lower(email: AnyPgColumn): SQL {
	return sql`lower(${email})`;
}
