CREATE TABLE IF NOT EXISTS "bot"."accountHealthFactor" (
	"id" text PRIMARY KEY NOT NULL,
	"chainId" integer NOT NULL,
	"account" text NOT NULL,
	"silo" text NOT NULL,
	"healthFactor" real NOT NULL,
	"currentLiquidationThreshold" bigint NOT NULL,
	"currentLtv" bigint NOT NULL,
	"block" bigint NOT NULL
);
