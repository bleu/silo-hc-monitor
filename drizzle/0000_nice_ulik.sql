CREATE SCHEMA IF NOT EXISTS "bot";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "indexing_data";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bot"."chatSubscription" (
	"id" serial PRIMARY KEY NOT NULL,
	"chatId" integer NOT NULL,
	"silo" text NOT NULL,
	"account" text NOT NULL,
	"chainId" integer NOT NULL,
	"creator" text NOT NULL,
	"notificationThreshold" real NOT NULL,
	"paused" integer NOT NULL,
	"language" text NOT NULL,
	"chatTitle" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "indexing_data"."account" (
	"id" text PRIMARY KEY NOT NULL,
	"chainId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "indexing_data"."accountHealthFactor" (
	"id" text PRIMARY KEY NOT NULL,
	"chainId" integer NOT NULL,
	"account" text NOT NULL,
	"healthFactor" real NOT NULL,
	"currentLiquidationThreshold" bigint NOT NULL,
	"currentLtv" bigint NOT NULL,
	"block" bigint NOT NULL,
	"blockTimestamp" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "indexing_data"."borrow" (
	"id" text PRIMARY KEY NOT NULL,
	"chainId" integer NOT NULL,
	"account" text NOT NULL,
	"silo" text NOT NULL,
	"asset" text NOT NULL,
	"amount" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "indexing_data"."position" (
	"id" text PRIMARY KEY NOT NULL,
	"chainId" integer NOT NULL,
	"account" text NOT NULL,
	"silo" text NOT NULL,
	"asset" text NOT NULL,
	"balance" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "indexing_data"."repay" (
	"id" text PRIMARY KEY NOT NULL,
	"chainId" integer NOT NULL,
	"account" text NOT NULL,
	"silo" text NOT NULL,
	"asset" text NOT NULL,
	"amount" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "indexing_data"."silo" (
	"id" text PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"chainId" integer NOT NULL,
	"asset" text NOT NULL,
	"assetSymbol" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "indexing_data"."token" (
	"id" text PRIMARY KEY NOT NULL,
	"chainId" integer NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"decimals" integer NOT NULL
);
