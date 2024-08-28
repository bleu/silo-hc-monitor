import type { Context, SessionFlavor } from "grammy";
import type {
	ForceReply,
	InlineKeyboardMarkup,
	ReplyKeyboardMarkup,
	ReplyKeyboardRemove,
} from "grammy/types";
import type { Address } from "viem";
import { STATE_TYPES } from "./constants";
import type { accountHealthFactor, chatSubscription } from "./db/bot/schema";
import type { position, silo } from "./db/indexing_data/schema";

export type Position = typeof position.$inferSelect;
export type Subscription = typeof chatSubscription.$inferSelect;
export type Silo = typeof silo.$inferSelect;
export type AccountHealthFactor = typeof accountHealthFactor.$inferSelect;

export interface SessionData {
	state: State;
}

export enum Command {
	START = "start",
	WATCH = "watch",
	MANAGE = "manage",
	HELP = "help",
	EXAMPLE = "example",
}

export enum WatchAction {
	START = "watch:start",
	ADDRESS_INPUT = "watch:address_input",
	INTERVAL_INPUT = "watch:interval_input",
	POSITION_SELECTION = "watch:position_selection",
	CHAT_SELECTION = "watch:chat_selection",
	THRESHOLD_SELECTION = "watch:threshold_selection",
	CONFIRMATION = "watch:confirmation",
}

export enum ManageAction {
	LIST_SUBSCRIPTIONS = "manage:list_subscriptions",
	SUBSCRIPTION_DETAILS = "manage:subscription_details",
	CHANGE_SETTINGS = "manage:change_settings",
	PAUSE_SUBSCRIPTION = "manage:pause_subscription",
	RESTART_SUBSCRIPTION = "manage:restart_subscription",
	UNSUBSCRIBE_SUBSCRIPTION = "manage:unsubscribe_subscription",
}

export enum GlobalAction {
	PAUSE_ALL = "global:pause_all",
	RESTART_ALL = "global:restart_all",
	UNSUBSCRIBE_ALL = "global:unsubscribe_all",
}

export type Action = WatchAction | ManageAction | GlobalAction;

export interface WatchState {
	action: WatchAction;
	address?: Address;
	positions?: Position[];
	selectedPosition?: Position;
	selectedChatId?: number;
	selectedThreshold?: number;
	selectedCoolDownPeriod?: number;
	params?: string[];
}
export interface ManageState {
	action: ManageAction | GlobalAction;
	subscriptions?: Subscription[];
	selectedSubscription?: Subscription;
	subscriptionId?: number;
	settingToChange?: string;
	newValue?: string;
}

export type State =
	| { type: "watch"; data: WatchState }
	| { type: "manage"; data: ManageState }
	| { type: "idle" };

export interface CommandResponse {
	newState: State;
	reply: {
		chatId?: number;
		text: string;
		parse_mode?: "Markdown" | "HTML";
		reply_markup?:
			| InlineKeyboardMarkup
			| ReplyKeyboardMarkup
			| ReplyKeyboardRemove
			| ForceReply;
	};
}

export interface SubscriptionState {
	silo: Address;
	account: Address;
	chainId: number;
	notificationChatId: number;
	notificationThreshold: number;
	language: string;
	coolDownPeriod: number;
}
