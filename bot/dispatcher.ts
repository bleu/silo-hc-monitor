import type { Chat } from "grammy/types";
import invariant from "tiny-invariant";
import { handleExample } from "./commands/example";
import { handleHelp } from "./commands/help";
import {
	handleManage,
	handleManageCallbackQuery,
	handleManageUpdates,
} from "./commands/manage";
import { handleStart } from "./commands/start";
import { handlewatch, handlewatchStep } from "./commands/watch";
import type { NotificationService } from "./services/notificationService";
import type { ChatSubscriptionManager } from "./services/subscriptionManager";
import type { Action, State } from "./types";

export type CommandHandler = (
	chatId: number,
	userId: number,
	args: string[],
	state: State,
	subscriptionManager: ChatSubscriptionManager,
	notificationService: NotificationService,
) => Promise<{
	newState: State;
	reply: {
		chat_id?: number;
		text: string;
		parse_mode?: string;
		reply_markup?: Record<string, unknown>;
	};
}>;

export const handlers: Record<string, CommandHandler> = {
	watch: handlewatch,
	example: handleExample,
	help: handleHelp,
	start: handleStart,
	manage: handleManage,
};

export const CommandDispatcher = {
	async dispatch(
		command: string,
		chatId: number,
		userId: number,
		args: string[],
		state: State,
		subscriptionManager: ChatSubscriptionManager,
		notificationService: NotificationService,
	) {
		const handler = handlers[command as keyof typeof handlers];

		if (handler) {
			return await handler(
				chatId,
				userId,
				args,
				state,
				subscriptionManager,
				notificationService,
			);
		}

		return {
			newState: state,
			reply: {
				text: "Unknown command. Please type /help for a list of available commands.",
			},
		};
	},

	async handleStep(
		step: Action,
		text: string,
		chatId: number,
		userId: number,
		state: State,
		subscriptionManager: ChatSubscriptionManager,
	) {
		switch (step) {
			case "user_address":
			case "position_selection":
			case "chain_id":
				return handlewatchStep(
					step,
					text,
					chatId,
					userId,
					state,
					subscriptionManager,
				);
			default:
				if (state.updating) {
					return handleManageUpdates(
						state.updating,
						text,
						chatId,
						userId,
						state,
						subscriptionManager,
					);
				}
				return {
					newState: state,
					reply: { text: "Unknown step." },
				};
		}
	},

	async handleCallbackQuery(
		data: string,
		chat: Chat | undefined,
		userId: number,
		state: State,
		subscriptionManager: ChatSubscriptionManager,
	) {
		invariant(chat, "Chat not found");

		const chatId = chat.id;
		const [action, param] = data.split(":") as [Action, string];
		switch (action) {
			case "position_selection":
			case "user_address":
			case "chain_id":
				return handlewatchStep(
					action,
					param || "",
					chatId,
					userId,
					state,
					subscriptionManager,
				);
			case "pauseall":
			case "restartall":
			case "unsubscribeall":
			case "manage_chat":
			case "manage_sub":
			case "manage_subscription":
			case "pause_subscription":
			case "restart_subscription":
			case "unsubscribe_subscription":
			case "change_settings":
			case "manage_links":
			case "edit_link_action":
			case "update_min_buy_amount":
			case "update_trade_size_emoji":
			case "update_trade_size_step":
			case "update_language":
			case "set_language":
				return handleManageCallbackQuery(
					data,
					chatId,
					userId,
					state,
					subscriptionManager,
				);
			default:
				return {
					newState: state,
					reply: {
						text: "Unknown action.",
					},
				};
		}
	},
};
