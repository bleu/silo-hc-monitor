import invariant from "tiny-invariant";
import type { ChatSubscriptionManager } from "../services/subscriptionManager";
import type { State, Subscription } from "../types";
import { getChainLabel, truncateAddress } from "../utils";

export async function handleManage(
	chatId: number,
	userId: number,
	args: string[],
	state: State,
	subscriptionManager: ChatSubscriptionManager,
) {
	const subscriptions =
		await subscriptionManager.listSubscriptionsFromUser(userId);

	if (subscriptions.length === 0) {
		return {
			newState: state,
			reply: {
				chat_id: chatId,
				text: "You don't have any subscriptions yet. Use /watch to create a new subscription.",
			},
		};
	}

	const buttons = buildSubscriptionButtons(subscriptions);

	return {
		newState: state,
		reply: {
			chat_id: chatId,
			text: "Select a subscription to manage:",
			reply_markup: { inline_keyboard: buttons },
		},
	};
}

export async function handleManageCallbackQuery(
	data: string,
	chatId: number,
	userId: number,
	state: State,
	subscriptionManager: ChatSubscriptionManager,
) {
	const [action, param] = data.split(":");

	switch (action) {
		case "manage_sub":
		case "pause_subscription":
		case "restart_subscription":
		case "unsubscribe_subscription":
		case "change_settings":
			return handleSubscriptionAction(
				action,
				param,
				chatId,
				userId,
				state,
				subscriptionManager,
			);
		case "pauseall":
		case "restartall":
		case "unsubscribeall":
			return handleAllAction(
				action,
				chatId,
				userId,
				state,
				subscriptionManager,
			);
		case "manage_chat":
			return handleManageChat(
				param,
				chatId,
				userId,
				state,
				subscriptionManager,
			);
		default:
			return {
				newState: state,
				reply: { chat_id: chatId, text: "Unknown action. Please try again." },
			};
	}
}

function buildSubscriptionButtons(subscriptions: Subscription[]) {
	const buttons = subscriptions.map((sub) => [
		{
			text: `${getChainLabel(sub.chainId)} - ${truncateAddress(sub.silo)}`,
			callback_data: `manage_sub:${sub.id}`,
		},
	]);

	buttons.push([
		{
			text: "Pause All Subscriptions",
			callback_data: "pauseall",
		},
		{
			text: "Restart All Subscriptions",
			callback_data: "restartall",
		},
	]);

	buttons.push([
		{
			text: "Unsubscribe from All",
			callback_data: "unsubscribeall",
		},
	]);

	return buttons;
}

async function handleSubscriptionAction(
	action: string,
	subscriptionId: string,
	chatId: number,
	userId: number,
	state: State,
	subscriptionManager: ChatSubscriptionManager,
) {
	const subscription =
		await subscriptionManager.getSubscription(subscriptionId);
	invariant(subscription, `Subscription with id ${subscriptionId} not found`);

	switch (action) {
		case "pause_subscription":
			return handlePauseSubscription(
				subscription,
				chatId,
				state,
				subscriptionManager,
			);
		case "restart_subscription":
			return handleRestartSubscription(
				subscription,
				chatId,
				state,
				subscriptionManager,
			);
		case "unsubscribe_subscription":
			return handleUnsubscribeSubscription(
				subscription,
				chatId,
				state,
				subscriptionManager,
			);
		case "change_settings":
			return handleChangeSettings(subscription, chatId, state);
		case "manage_sub":
			return showSubscriptionDetails(subscription, chatId, state);
		default:
			return {
				newState: state,
				reply: {
					chat_id: chatId,
					text: "Unknown subscription action. Please try again.",
				},
			};
	}
}

async function handleAllAction(
	action: string,
	chatId: number,
	userId: number,
	state: State,
	subscriptionManager: ChatSubscriptionManager,
) {
	switch (action) {
		case "pauseall":
			await subscriptionManager.pauseAll(userId);
			return {
				newState: state,
				reply: { chat_id: chatId, text: "All subscriptions have been paused." },
			};
		case "restartall":
			await subscriptionManager.restartAll(userId);
			return {
				newState: state,
				reply: {
					chat_id: chatId,
					text: "All subscriptions have been restarted.",
				},
			};
		case "unsubscribeall":
			await subscriptionManager.unsubscribeAll(userId);
			return {
				newState: state,
				reply: {
					chat_id: chatId,
					text: "You have unsubscribed from all subscriptions.",
				},
			};
		default:
			return {
				newState: state,
				reply: {
					chat_id: chatId,
					text: "Unknown bulk action. Please try again.",
				},
			};
	}
}

async function handlePauseSubscription(
	subscription: Subscription,
	chatId: number,
	state: State,
	subscriptionManager: ChatSubscriptionManager,
) {
	await subscriptionManager.pauseSubscription(subscription.id);
	return {
		newState: state,
		reply: { chat_id: chatId, text: "Subscription paused." },
	};
}

async function handleRestartSubscription(
	subscription: Subscription,
	chatId: number,
	state: State,
	subscriptionManager: ChatSubscriptionManager,
) {
	await subscriptionManager.restartSubscription(subscription.id);
	return {
		newState: state,
		reply: { chat_id: chatId, text: "Subscription restarted." },
	};
}

async function handleUnsubscribeSubscription(
	subscription: Subscription,
	chatId: number,
	state: State,
	subscriptionManager: ChatSubscriptionManager,
) {
	await subscriptionManager.unsubscribe(subscription.id);
	return {
		newState: state,
		reply: { chat_id: chatId, text: "Unsubscribed from subscription." },
	};
}

async function handleChangeSettings(
	subscription: Subscription,
	chatId: number,
	state: State,
) {
	return {
		newState: state,
		reply: {
			chat_id: chatId,
			text: "Settings updated (feature not implemented).",
		},
	};
}

async function showSubscriptionDetails(
	subscription: Subscription,
	chatId: number,
	state: State,
) {
	return {
		newState: state,
		reply: {
			chat_id: chatId,
			text: `Subscription Details:
      - Silo: ${truncateAddress(subscription.silo)}
      - Chain: ${getChainLabel(subscription.chainId)}
      - Threshold: ${subscription.notificationThreshold}
      `,
		},
	};
}

async function handleManageChat(
	chatId: string,
	userId: number,
	state: State,
	subscriptionManager: ChatSubscriptionManager,
) {
	return {
		newState: state,
		reply: {
			chat_id: chatId,
			text: "Manage chat feature not implemented yet.",
		},
	};
}
