CREATE TABLE IF NOT EXISTS "account" (
	"id" text PRIMARY KEY NOT NULL,
	"chainId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accountHealthFactor" (
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
CREATE TABLE IF NOT EXISTS "borrow" (
	"id" text PRIMARY KEY NOT NULL,
	"chainId" integer NOT NULL,
	"account" text NOT NULL,
	"silo" text NOT NULL,
	"amount" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chatSubscription" (
	"id" text PRIMARY KEY NOT NULL,
	"chatId" integer NOT NULL,
	"silo" text NOT NULL,
	"user" text NOT NULL,
	"chainId" integer NOT NULL,
	"creator" text NOT NULL,
	"notificationThreshold" real NOT NULL,
	"paused" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "position" (
	"id" text PRIMARY KEY NOT NULL,
	"chainId" integer NOT NULL,
	"account" text NOT NULL,
	"silo" text NOT NULL,
	"balance" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "repay" (
	"id" text PRIMARY KEY NOT NULL,
	"chainId" integer NOT NULL,
	"account" text NOT NULL,
	"silo" text NOT NULL,
	"amount" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "silo" (
	"id" text PRIMARY KEY NOT NULL,
	"chainId" integer NOT NULL,
	"asset" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "token" (
	"id" text PRIMARY KEY NOT NULL,
	"chainId" integer NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"decimals" integer NOT NULL
);
