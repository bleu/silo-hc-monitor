import type { Chat } from "grammy/types";
import invariant from "tiny-invariant";
import type { CommandHandler } from "./commands";
import { handleExample } from "./commands/example";
import { handleHelp } from "./commands/help";
import { handleManage, handleManageStep } from "./commands/manage";
import { handleStart } from "./commands/start";
import { handleWatch, handleWatchStep } from "./commands/watch";
import { MESSAGES, STATE_TYPES } from "./constants";
import type { NotificationService } from "./services/notificationService";
import type { ChatSubscriptionManager } from "./services/subscriptionManager";
import {
	type Action,
	Command,
	type CommandResponse,
	GlobalAction,
	ManageAction,
	type State,
	type WatchAction,
} from "./types";
import { BotError } from "./utils/errorHandler";
import { formatResponse } from "./utils/responseFormatter";
import { createState } from "./utils/stateManager";

export const handlers: Record<Command, CommandHandler> = {
	[Command.WATCH]: handleWatch,
	[Command.EXAMPLE]: handleExample,
	[Command.HELP]: handleHelp,
	[Command.START]: handleStart,
	[Command.MANAGE]: handleManage,
};

export const CommandDispatcher = {
	async dispatch(
		command: Command,
		chatId: number,
		userId: number,
		args: string[],
		state: State,
		subscriptionManager: ChatSubscriptionManager,
		notificationService: NotificationService,
	): Promise<CommandResponse> {
		const handler = handlers[command];

		if (handler) {
			try {
				return await handler(
					chatId,
					userId,
					args,
					state,
					subscriptionManager,
					notificationService,
				);
			} catch (error) {
				throw new BotError(
					`Failed to handle command: ${command}`,
					"COMMAND_DISPATCH_ERROR",
					error,
				);
			}
		}

		return {
			newState: state,
			reply: {
				text: MESSAGES.UNKNOWN_COMMAND,
				parse_mode: "Markdown",
			},
		};
	},

	async handleCallbackQuery(
		data: string,
		chat: Chat,
		userId: number,
		state: State,
		subscriptionManager: ChatSubscriptionManager,
	): Promise<CommandResponse> {
		invariant(chat, "Chat not found");
		console.log("Handling callback query with data:", data);

		const action = data;
		console.log("Parsed action:", action);

		return this.handleStep(
			action,
			"",
			chat.id,
			userId,
			state,
			subscriptionManager,
		);
	},

	async handleStep(
		action: Action | string,
		input: string,
		chatId: number,
		userId: number,
		state: State,
		subscriptionManager: ChatSubscriptionManager,
	): Promise<CommandResponse> {
		if (!action) {
			throw new BotError(
				"Action is undefined in handleStep",
				"UNDEFINED_ACTION",
			);
		}
		let newState: State = state;

		if (typeof action === "string") {
			const [actionType, actionName, ...params] = action.split(":");
			if (actionType === "watch") {
				newState = createState(STATE_TYPES.WATCH, {
					...(state.type !== "idle" ? state.data : {}),
					action: `${actionType}:${actionName}` as WatchAction,
					params,
				});
			} else if (actionType === "manage") {
				newState = createState(STATE_TYPES.MANAGE, {
					...(state.type !== "idle" ? state.data : {}),
					action: actionName
						? (`${actionType}:${actionName}` as ManageAction)
						: ManageAction.LIST_SUBSCRIPTIONS,
				});
			}
		}

		switch (newState.type) {
			case STATE_TYPES.WATCH:
				return handleWatchStep(
					action as WatchAction,
					input,
					chatId,
					userId,
					newState.data,
					subscriptionManager,
				);
			case STATE_TYPES.MANAGE:
				return handleManageStep(
					action as ManageAction,
					chatId,
					userId,
					newState.data,
				);
			case STATE_TYPES.IDLE:
				if (Object.values(GlobalAction).includes(action as GlobalAction)) {
					throw new BotError(
						"Global action handling not implemented",
						"GLOBAL_ACTION_NOT_IMPLEMENTED",
					);
				}
				return {
					newState: newState,
					reply: {
						text: MESSAGES.INVALID_ACTION,
						parse_mode: "Markdown",
					},
				};
			default:
				throw new BotError(
					`Unknown state type: ${(newState as any).type}`,
					"UNKNOWN_STATE_TYPE",
				);
		}
	},
};
