import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./bot/db/**/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_PRIVATE_URL || "",
	},
});
