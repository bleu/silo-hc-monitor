export const MESSAGES = {
	WELCOME: `
  *Welcome to the Silo Finance Bot!* 🤖
  Use this bot to receive notifications for your Silo Finance positions.
  
  Commands:
  /watch - Add a new silo position to track
  /manage - Manage your subscriptions
  /help - Get detailed information about commands
  /example - Get an example notification message
  
  Use these commands to stay updated on your Silo Finance positions and manage your alert preferences.
	`,
	ENTER_ADDRESS: "Please enter your account address:",
	ENTER_INTERVAL:
		"Please enter a notification interval in seconds (must be greater than 60):",
	INVALID_ADDRESS:
		"❌ Invalid address. Please try again with a valid Ethereum address.",
	NO_POSITIONS_FOUND:
		"❌ No positions found for this address. Please check the address and try again.",
	INVALID_SELECTION: "❌ Invalid selection. Please try again.",
	MISSING_INFORMATION: "❌ Missing required information. Please start over.",
	SUBSCRIPTION_ADDED: "✅ Subscription added successfully!",
	SUBSCRIPTION_FAILED: "❌ Failed to add subscription. Please try again.",
	SELECT_CHAT: "Please select a chat to receive notifications:",
	UNKNOWN_COMMAND:
		"❌ Unknown command. Please type /help for a list of available commands.",
	UNKNOWN_STEP: "❌ Unknown step in process.",
	INVALID_CHAT_SELECTION: "❌ Invalid chat selection. Please try again.",
	CHANGES_APPLIED: "Changes applied successfully.",
	SUBSCRIPTION_PAUSED: "✅ Subscription paused.",
	SUBSCRIPTION_RESTARTED: "✅ Subscription restarted.",
	UNSUBSCRIBED: "✅ Unsubscribed from subscription.",
	NO_SUBSCRIPTIONS: "You don't have any subscriptions to manage.",
	ALL_SUBSCRIPTIONS_PAUSED: "✅ All subscriptions have been paused.",
	ALL_SUBSCRIPTIONS_RESTARTED: "✅ All subscriptions have been restarted.",
	ALL_SUBSCRIPTIONS_UNSUBSCRIBED:
		"✅ All subscriptions have been unsubscribed from.",
	INVALID_ACTION: "Invalid action for current state.",
	ERROR_OCCURRED: "An error occurred. Please try again.",
};

export const BUTTONS = {
	MANAGE_SUBSCRIPTIONS: "Manage Subscriptions",
	ADD_ANOTHER_SUBSCRIPTION: "Add Another Subscription",
	SELECT_CHAT: "Select Chat",
	VIEW_POSITION: "View Position",
	ADD_COLLATERAL: "Add Collateral",
	REPAY_DEBT: "Repay Debt",
	MANAGE_SUBSCRIPTION: "Manage Subscription",
	PAUSE_ALL: "Pause All",
	RESTART_ALL: "Restart All",
	UNSUBSCRIBE_ALL: "Unsubscribe from All",
	CHANGE_NOTIFICATION_THRESHOLD: "Change Notification Threshold",
	UPDATE_LANGUAGE: "Update Language",
	BACK_TO_SUBSCRIPTIONS: "Back to Subscriptions",
	BACK_TO_SUBSCRIPTION: "Back to Subscription",
	START_WATCHING: "Start Watching",
	ADD_NEW_SUBSCRIPTION: "Add New Subscription",
	CHANGE_SETTINGS: "⚙️ Change Settings",
	PAUSE: "⏸ Pause",
	RESTART: "▶️ Restart",
	UNSUBSCRIBE: "🗑️ Unsubscribe",
};

export const SUPPORTED_CHAINS = {
	MAINNET: 1,
	ARBITRUM: 42161,
	OPTIMISM: 10,
	BASE: 8453,
} as const;

export const CHAIN_NAMES = {
	[SUPPORTED_CHAINS.MAINNET]: "Mainnet",
	[SUPPORTED_CHAINS.ARBITRUM]: "Arbitrum",
	[SUPPORTED_CHAINS.OPTIMISM]: "Optimism",
	[SUPPORTED_CHAINS.BASE]: "Base",
} as const;

export const PARSE_MODE = {
	MARKDOWN: "Markdown",
	HTML: "HTML",
} as const;

export const STATE_TYPES = {
	WATCH: "watch",
	MANAGE: "manage",
	SETTINGS: "settings",
	IDLE: "idle",
} as const;
