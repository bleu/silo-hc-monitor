import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { Client } from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_PRIVATE_URL) {
	throw new Error("DATABASE_PRIVATE_URL is not set");
}

const client = new Client({
	connectionString: process.env.DATABASE_PRIVATE_URL,
});

await client.connect();

export const db = drizzle(client, { schema });
