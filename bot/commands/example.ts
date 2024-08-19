import type { CommandHandler } from ".";
import type { NotificationService } from "../services/notificationService";
import type { ChatSubscriptionManager } from "../services/subscriptionManager";
import type { AccountHealthFactor, State, Subscription } from "../types";
import { formatSubscriptionSettings } from "../utils";
import { createCommandResponse, formatMessage } from "../utils/responseUtils";

export const handleExample: CommandHandler = async (
	chatId: number,
	userId: number,
	args: string[],
	state: State,
	_subscriptionManager: ChatSubscriptionManager,
	notificationService: NotificationService,
) => {
	const exampleHealthFactorUpdate: AccountHealthFactor = {
		id: "0xExampleSilo:0xExampleUser:1",
		silo: "0xExampleSilo",
		account: "0xExampleUser",
		chainId: 1,
		healthFactor: 0.1,
		currentLiquidationThreshold: 0.6,
		currentLtv: 0.5,
		block: 15000000,
		blockTimestamp: 15000000,
	};

	const subscription: Subscription = {
		id: 0,
		chatId: chatId,
		silo: "0x8ED1609D796345661d36291B411992e85DE7B224",
		account: "0xExampleUser",
		chainId: 1,
		language: "en",
		chatTitle: "Example Chat",
		creator: userId.toString(),
		notificationThreshold: 0.1,
		paused: 0,
	};

	await notificationService.sendMessage(
		subscription,
		exampleHealthFactorUpdate,
	);

	const settingsMessage = formatSubscriptionSettings(subscription);

	return createCommandResponse(chatId, settingsMessage, state, "Markdown");
};
