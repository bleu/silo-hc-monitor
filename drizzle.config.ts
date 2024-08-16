import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./bot/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.PRIVATE_DATABASE_URL!,
  },
});
