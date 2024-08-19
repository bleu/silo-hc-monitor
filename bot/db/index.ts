import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as botSchema from "./bot/schema";
import * as indexingDataSchema from "./indexing_data/schema";

if (!process.env.DATABASE_PRIVATE_URL) {
	throw new Error("DATABASE_PRIVATE_URL is not set");
}

export const client = new pg.Client({
	connectionString: process.env.DATABASE_PRIVATE_URL,
});

await client.connect();

export const db = drizzle(client, {
	schema: { ...indexingDataSchema, ...botSchema },
});
