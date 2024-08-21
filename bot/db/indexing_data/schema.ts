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

export function lower(data: AnyPgColumn): SQL {
	return sql`lower(${data})`;
}
