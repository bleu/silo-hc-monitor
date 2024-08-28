import invariant from "tiny-invariant";
import type { Address } from "viem";
import type { CommandHandler } from ".";
import { ChatSubscriptionManager } from "../services/subscriptionManager";
import type {
	CommandResponse,
	ManageState,
	State,
	Subscription,
} from "../types";
import { GlobalAction, ManageAction, WatchAction } from "../types";
import { getChainLabel, truncateAddress } from "../utils";
import {
	createCommandResponse,
	createInlineKeyboard,
} from "../utils/responseUtils";

// Define command-specific input types
type ListSubscriptionsInput = Record<string, never>;

type SubscriptionDetailsInput = {
	subscriptionId: string;
};

type ChangeSettingsInput = {
	subscriptionId: string;
	setting?: "threshold" | "language";
};

type SubscriptionActionInput = {
	subscriptionId: string;
};

type GlobalActionInput = Record<string, never>;

type ManageInput =
	| ListSubscriptionsInput
	| SubscriptionDetailsInput
	| ChangeSettingsInput
	| SubscriptionActionInput
	| GlobalActionInput;

export const handleManage: CommandHandler = async (
	chatId: number,
	userId: number,
	args: string[],
	state: State,
): Promise<CommandResponse> => {
	return handleListSubscriptions({
		chatId,
		userId,
		state: {
			action: ManageAction.LIST_SUBSCRIPTIONS,
		},
	});
};

export async function handleManageStep(
	action: string,
	chatId: number,
	userId: number,
	state: ManageState,
	input?: string,
): Promise<CommandResponse> {
	const [actionType, actionName, subscriptionId, settingToChange] =
		action.split(":");
	const fullAction = `${actionType}:${actionName}` as
		| ManageAction
		| GlobalAction;

	const handlers = {
		[ManageAction.LIST_SUBSCRIPTIONS]: handleListSubscriptions,
		[ManageAction.SUBSCRIPTION_DETAILS]: handleSubscriptionDetails,
		[ManageAction.CHANGE_SETTINGS]: handleChangeSettings,
		[ManageAction.PAUSE_SUBSCRIPTION]: handlePauseSubscription,
		[ManageAction.RESTART_SUBSCRIPTION]: handleRestartSubscription,
		[ManageAction.UNSUBSCRIBE_SUBSCRIPTION]: handleUnsubscribeSubscription,
		[GlobalAction.PAUSE_ALL]: handleGlobalAction,
		[GlobalAction.RESTART_ALL]: handleGlobalAction,
		[GlobalAction.UNSUBSCRIBE_ALL]: handleGlobalAction,
	} as const;

	const handler = handlers[fullAction];
	if (handler) {
		if (fullAction === ManageAction.CHANGE_SETTINGS && state.settingToChange) {
			return handleSettingChange({
				chatId,
				userId,
				state: {
					...state,
					subscriptionId: state.subscriptionId,
					settingToChange: state.settingToChange,
					newValue: input,
				},
			});
		}
		return handler({
			chatId,
			userId,
			state: {
				...state,
				action: fullAction,
				subscriptionId: Number(subscriptionId),
				settingToChange,
			},
		});
	}

	// If no specific handler is found, default to listing subscriptions
	return handleListSubscriptions({
		chatId,
		userId,
		state: {
			...state,
			action: ManageAction.LIST_SUBSCRIPTIONS,
		},
	});
}

async function handleListSubscriptions({
	chatId,
	userId,
	state,
}: {
	chatId: number;
	userId: number;
	state: ManageState;
}): Promise<CommandResponse> {
	const subscriptionManager = new ChatSubscriptionManager();
	const subscriptions =
		await subscriptionManager.listSubscriptionsFromUser(userId);

	let message: string;
	let buttons: Array<Array<{ text: string; callback_data: string }>>;

	if (subscriptions.length === 0) {
		message =
			"You don't have any active subscriptions yet. Would you like to create one?";
		buttons = [
			[{ text: "Start Watching", callback_data: `${WatchAction.START}` }],
		];
	} else {
		message = "📋 *Your Subscriptions*\n\nSelect a subscription to manage:";
		buttons = subscriptions.map((sub: Subscription) => [
			{
				text: `${getChainLabel(sub.chainId)} - ${truncateAddress(
					sub.silo as Address,
				)}`,
				callback_data: `${ManageAction.SUBSCRIPTION_DETAILS}:${sub.id}`,
			},
		]);

		buttons.push(
			[
				{ text: "Pause All", callback_data: GlobalAction.PAUSE_ALL },
				{ text: "Restart All", callback_data: GlobalAction.RESTART_ALL },
			],
			[
				{
					text: "Unsubscribe from All",
					callback_data: GlobalAction.UNSUBSCRIBE_ALL,
				},
			],
			[{ text: "Add New Subscription", callback_data: WatchAction.START }],
		);
	}

	return createCommandResponse(
		chatId,
		message,
		{ type: "manage", data: { ...state, subscriptions } },
		"Markdown",
		createInlineKeyboard(buttons),
	);
}

async function handleSubscriptionDetails({
	chatId,
	userId,
	state,
}: {
	chatId: number;
	userId: number;
	state: ManageState;
}): Promise<CommandResponse> {
	const subscriptionManager = new ChatSubscriptionManager();
	const subscription = await subscriptionManager.getSubscription(
		Number(state.subscriptionId),
	);

	if (!subscription) {
		return createCommandResponse(
			chatId,
			"❌ Subscription not found.",
			{ type: "manage", data: state },
			"Markdown",
		);
	}

	const details = `
  *Subscription Details*
  Chain: ${getChainLabel(subscription.chainId)}
  Silo: \`${truncateAddress(subscription.silo as Address)}\`
  Account: \`${truncateAddress(subscription.account as Address)}\`
  Status: ${subscription.paused ? "Paused" : "Active"}
  Notification Threshold: ${subscription.notificationThreshold}
  Language: ${subscription.language}
  Interval: \`${subscription.cooldownSeconds}\` seconds
  `;

	const buttons = [
		[
			{
				text: subscription.paused ? "▶️ Restart" : "⏸ Pause",
				callback_data: `${
					subscription.paused
						? ManageAction.RESTART_SUBSCRIPTION
						: ManageAction.PAUSE_SUBSCRIPTION
				}:${subscription.id}`,
			},
			{
				text: "🗑️ Unsubscribe",
				callback_data: `${ManageAction.UNSUBSCRIBE_SUBSCRIPTION}:${subscription.id}`,
			},
		],
		[
			{
				text: "⚙️ Change Settings",
				callback_data: `${ManageAction.CHANGE_SETTINGS}:${subscription.id}`,
			},
		],
		[
			{
				text: "Back to Subscriptions",
				callback_data: ManageAction.LIST_SUBSCRIPTIONS,
			},
		],
	];

	return createCommandResponse(
		chatId,
		details,
		{
			type: "manage",
			data: {
				...state,
				selectedSubscription: subscription,
			},
		},
		"Markdown",
		{ inline_keyboard: buttons },
	);
}

async function handleChangeSettings({
	chatId,
	userId,
	state,
}: {
	chatId: number;
	userId: number;
	state: ManageState;
}): Promise<CommandResponse> {
	if (!state.settingToChange) {
		// If no specific setting is selected, show the settings menu
		const buttons = [
			[
				{
					text: "Change Notification Threshold",
					callback_data: `${ManageAction.CHANGE_SETTINGS}:${state.subscriptionId}:threshold`,
				},
			],
			[
				{
					text: "Update Interval Between Notifications",
					callback_data: `${ManageAction.CHANGE_SETTINGS}:${state.subscriptionId}:cooldownPeriod`,
				},
			],
			[
				{
					text: "Update Language",
					callback_data: `${ManageAction.CHANGE_SETTINGS}:${state.subscriptionId}:language`,
				},
			],
			[
				{
					text: "Back to Subscription",
					callback_data: `${ManageAction.SUBSCRIPTION_DETAILS}:${state.subscriptionId}`,
				},
			],
		];

		return {
			newState: {
				type: "manage",
				data: {
					...state,
					action: ManageAction.CHANGE_SETTINGS,
				},
			},
			reply: {
				chatId: chatId,
				text: "Select a setting to change:",
				reply_markup: { inline_keyboard: buttons },
			},
		};
	}

	// A specific setting has been selected
	let message: string;

	switch (state.settingToChange) {
		case "threshold":
			message =
				"Please enter the new notification threshold (e.g., 0.1 for 10%):";
			break;
		case "language":
			message =
				"Please enter the new language code (e.g., 'en' for English, 'es' for Spanish):";
			break;
		case "cooldownPeriod":
			message =
				"Please enter the new period in seconds greater than or equal to 60 (e.g., 3600 for one hour) that will be the interval between notifications about the same event:";
			break;
		default:
			throw new Error(`Unsupported setting: ${state.settingToChange}`);
	}

	return {
		newState: {
			type: "manage",
			data: {
				...state,
				action: ManageAction.CHANGE_SETTINGS,
			},
		},
		reply: {
			chatId: chatId,
			text: message,
		},
	};
}

async function handlePauseSubscription({
	chatId,
	userId,
	state,
}: {
	chatId: number;
	userId: number;
	state: ManageState;
}): Promise<CommandResponse> {
	const subscriptionManager = new ChatSubscriptionManager();
	invariant(state.subscriptionId, "Subscription ID is required to pause.");
	await subscriptionManager.pauseSubscription(state.subscriptionId);
	return {
		newState: { type: "manage", data: state },
		reply: {
			chatId: chatId,
			text: "✅ Subscription paused.",
			parse_mode: "Markdown",
		},
	};
}

async function handleRestartSubscription({
	chatId,
	userId,
	state,
}: {
	chatId: number;
	userId: number;
	state: ManageState;
}): Promise<CommandResponse> {
	const subscriptionManager = new ChatSubscriptionManager();
	invariant(state.subscriptionId, "Subscription ID is required to pause.");
	await subscriptionManager.restartSubscription(state.subscriptionId);
	return {
		newState: { type: "manage", data: state },
		reply: {
			chatId: chatId,
			text: "✅ Subscription restarted.",
			parse_mode: "Markdown",
		},
	};
}

async function handleUnsubscribeSubscription({
	chatId,
	userId,
	state,
}: {
	chatId: number;
	userId: number;
	state: ManageState;
}): Promise<CommandResponse> {
	const subscriptionManager = new ChatSubscriptionManager();
	invariant(state.subscriptionId, "Subscription ID is required to pause.");
	await subscriptionManager.unsubscribe(state.subscriptionId);
	return {
		newState: { type: "manage", data: state },
		reply: {
			chatId: chatId,
			text: "✅ Unsubscribed from subscription.",
			parse_mode: "Markdown",
		},
	};
}

async function handleGlobalAction({
	chatId,
	userId,
	state,
}: {
	chatId: number;
	userId: number;
	state: ManageState;
}): Promise<CommandResponse> {
	const subscriptionManager = new ChatSubscriptionManager();
	const subscriptions =
		await subscriptionManager.listSubscriptionsFromUser(userId);

	if (subscriptions.length === 0) {
		return {
			newState: { type: "idle" },
			reply: {
				chatId: chatId,
				text: "You don't have any subscriptions to manage.",
				parse_mode: "Markdown",
			},
		};
	}

	const actionMap = {
		[GlobalAction.PAUSE_ALL]: subscriptionManager.pauseAll,
		[GlobalAction.RESTART_ALL]: subscriptionManager.restartAll,
		[GlobalAction.UNSUBSCRIBE_ALL]: subscriptionManager.unsubscribeAll,
	};

	await actionMap[state.action as GlobalAction](userId);

	const actionText = {
		[GlobalAction.PAUSE_ALL]: "paused",
		[GlobalAction.RESTART_ALL]: "restarted",
		[GlobalAction.UNSUBSCRIBE_ALL]: "unsubscribed from",
	} as const;

	return {
		newState: { type: "idle" },
		reply: {
			chatId: chatId,
			text: `✅ All subscriptions have been ${
				actionText[state.action as unknown as GlobalAction]
			}.`,
			parse_mode: "Markdown",
		},
	};
}

async function handleSettingChange({
	chatId,
	userId,
	state,
}: {
	chatId: number;
	userId: number;
	state: ManageState;
}): Promise<CommandResponse> {
	invariant(
		state.subscriptionId,
		"Subscription ID is required to change settings.",
	);
	invariant(state.settingToChange, "Setting to change must be specified.");
	invariant(state.newValue, "New value must be provided.");

	const subscriptionManager = new ChatSubscriptionManager();
	let message: string;

	console.log("Changing setting:", state.settingToChange);
	console.log("New value:", state.newValue);
	console.log("Subscription ID:", state.subscriptionId);

	try {
		switch (state.settingToChange) {
			case "threshold": {
				const threshold = Number.parseFloat(state.newValue);
				if (Number.isNaN(threshold) || threshold < 0 || threshold > 1) {
					throw new Error(
						"Invalid threshold value. Please enter a number between 0 and 1.",
					);
				}
				await subscriptionManager.updateSubscriptionSetting(
					state.subscriptionId,
					"notificationThreshold",
					threshold,
				);
				message = `✅ Notification threshold updated to ${threshold * 100}%.`;
				break;
			}
			case "language":
				// You might want to add validation for supported language codes
				await subscriptionManager.updateSubscriptionSetting(
					state.subscriptionId,
					"language",
					state.newValue,
				);
				message = `✅ Language updated to ${state.newValue}.`;
				break;
			case "cooldownPeriod": {
				const cooldownPeriod = Number.parseInt(state.newValue);

				if (Number.isNaN(cooldownPeriod) || cooldownPeriod < 1) {
					throw new Error(
						"Invalid interval value. Please in seconds and it must be greater than or equal to 1.",
					);
				}

				await subscriptionManager.updateSubscriptionSetting(
					state.subscriptionId,
					"cooldownSeconds",
					state.newValue,
				);

				message = `✅ Interval updated to ${state.newValue} minutes.`;
				break;
			}
			default:
				throw new Error(`Unsupported setting: ${state.settingToChange}`);
		}

		return {
			newState: {
				type: "manage",
				data: {
					action: ManageAction.SUBSCRIPTION_DETAILS,
					subscriptionId: state.subscriptionId,
				},
			},
			reply: {
				chatId: chatId,
				text: message,
				parse_mode: "Markdown",
			},
		};
	} catch (error) {
		return {
			newState: {
				type: "manage",
				data: {
					action: ManageAction.CHANGE_SETTINGS,
					subscriptionId: state.subscriptionId,
				},
			},
			reply: {
				chatId: chatId,
				text: `❌ Error: ${
					error instanceof Error ? error.message : "An unknown error occurred"
				}`,
				parse_mode: "Markdown",
			},
		};
	}
}
