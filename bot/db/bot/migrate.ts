import { migrate } from "drizzle-orm/node-postgres/migrator";
import { client, db } from "../index";

await migrate(db, { migrationsFolder: "./drizzle" });

await client.end();
