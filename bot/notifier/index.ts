import { client } from "../db";
import type { accountHealthFactor } from "../db/indexing_data/schema";
import { NotificationService } from "../services/notificationService";
import { ChatSubscriptionManager } from "../services/subscriptionManager";

// Listen for notifications on the specified channel
await client.query(`
DO $$
BEGIN
  -- Check if the trigger already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = '_trigger_account_health_factor'
    AND tgrelid = 'indexing_data."accountHealthFactor"'::regclass
  ) THEN
    -- Create the trigger function if it doesn't exist
    CREATE OR REPLACE FUNCTION indexing_data.notify_account_health_factor()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $function$
    DECLARE
      payload json;
    BEGIN
      -- Convert the NEW record to JSON
      payload := row_to_json(NEW);

      -- Notify with the JSON payload
      PERFORM pg_notify('account_health_factor_notification', payload::text);

      RETURN NEW;
    END;
    $function$;

    -- Create the trigger on the table
    CREATE TRIGGER _trigger_account_health_factor
    AFTER INSERT
    ON "indexing_data"."accountHealthFactor"
    FOR EACH ROW
    EXECUTE PROCEDURE indexing_data.notify_account_health_factor();
  END IF;
END;
$$;
`);

// Listen for notifications on the specified channel
await client.query("LISTEN account_health_factor_notification");

const subscriptionManager = new ChatSubscriptionManager();
const notificationService = new NotificationService(subscriptionManager);

client.on("notification", async (msg) => {
	if (msg.channel !== "account_health_factor_notification") return;
	if (!msg.payload) return;

	const payload: typeof accountHealthFactor.$inferSelect = JSON.parse(
		msg.payload,
	);

	await notificationService.handleNotification(payload);
});

console.log("Listening for account health factor notifications...");
