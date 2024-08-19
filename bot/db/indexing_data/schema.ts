import { type SQL, sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	bigint,
	boolean,
	integer,
	pgSchema,
	pgTable,
	real,
	text,
} from "drizzle-orm/pg-core";

export const schema = pgSchema("indexing_data");

export const account = schema.table("account", {
	id: text("id").primaryKey(),
	chainId: integer("chainId").notNull(),
});

export const silo = schema.table("silo", {
	id: text("id").primaryKey(),
	address: text("address").notNull(),
	chainId: integer("chainId").notNull(),
	asset: text("asset").notNull(),
	assetSymbol: text("assetSymbol"),
});

export const borrow = schema.table("borrow", {
	id: text("id").primaryKey(),
	chainId: integer("chainId").notNull(),
	account: text("account").notNull(),
	silo: text("silo").notNull(),
	asset: text("asset").notNull(),
	amount: bigint("amount", { mode: "number" }).notNull(),
});

export const repay = schema.table("repay", {
	id: text("id").primaryKey(),
	chainId: integer("chainId").notNull(),
	account: text("account").notNull(),
	silo: text("silo").notNull(),
	asset: text("asset").notNull(),
	amount: bigint("amount", { mode: "number" }).notNull(),
});

export const position = schema.table("position", {
	id: text("id").primaryKey(),
	chainId: integer("chainId").notNull(),
	account: text("account").notNull(),
	silo: text("silo").notNull(),
	asset: text("asset").notNull(),
	balance: bigint("balance", { mode: "number" }).notNull(),
});

export const token = schema.table("token", {
	id: text("id").primaryKey(),
	chainId: integer("chainId").notNull(),
	name: text("name").notNull(),
	symbol: text("symbol").notNull(),
	decimals: integer("decimals").notNull(),
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
	blockTimestamp: bigint("blockTimestamp", { mode: "number" }).notNull(),
});

export function lower(data: AnyPgColumn): SQL {
	return sql`lower(${data})`;
}
