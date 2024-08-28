ALTER TABLE "bot"."chatSubscription" ADD COLUMN "coolDownSeconds" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "bot"."chatSubscription" ADD COLUMN "lastNotifiedAt" timestamp;