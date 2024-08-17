// bot/types.ts

import type { Address } from "viem";
import type { chatSubscription, position, silo } from "./db/schema";

export type Position = typeof position.$inferSelect;
export type Subscription = typeof chatSubscription.$inferSelect;
export type Silo = typeof silo.$inferSelect;

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
  POSITION_SELECTION = "watch:position_selection",
  CHAT_SELECTION = "watch:chat_selection",
  CONFIRMATION = "watch:confirmation",
}

export enum ManageAction {
  LIST_SUBSCRIPTIONS = "manage:list_subscriptions",
  SUBSCRIPTION_DETAILS = "manage:subscription_details",
  CHANGE_SETTINGS = "manage:change_settings",
  CONFIRM_CHANGES = "manage:confirm_changes",
  PAUSE_SUBSCRIPTION = "manage:pause_subscription",
  RESTART_SUBSCRIPTION = "manage:restart_subscription",
  UNSUBSCRIBE_SUBSCRIPTION = "manage:unsubscribe_subscription",
}

export enum SettingsAction {
  SELECT_SETTING = "settings:select_setting",
  CHANGE_THRESHOLD = "settings:change_threshold",
  CHANGE_LANGUAGE = "settings:change_language",
}

export enum GlobalAction {
  PAUSE_ALL = "global:pause_all",
  RESTART_ALL = "global:restart_all",
  UNSUBSCRIBE_ALL = "global:unsubscribe_all",
}

export type Action = WatchAction | ManageAction | SettingsAction | GlobalAction;

export interface WatchState {
  action: WatchAction;
  address?: Address;
  positions?: Position[];
  selectedPosition?: Position;
  selectedChatId?: number;
}

export interface ManageState {
  action: ManageAction;
  subscriptions?: Subscription[];
  selectedSubscription?: Subscription;
  updatedSettings?: Partial<Subscription>;
}

export interface SettingsState {
  action: SettingsAction;
  subscriptionId: string;
  newThreshold?: number;
  newLanguage?: string;
}

export type State =
  | { type: "watch"; data: WatchState }
  | { type: "manage"; data: ManageState }
  | { type: "settings"; data: SettingsState }
  | { type: "idle" };

export interface CommandResponse {
  newState: State;
  reply: {
    chatId?: number;
    text: string;
    parse_mode?: "Markdown" | "HTML";
    reply_markup?: Record<string, unknown>;
  };
}

export interface SubscriptionState {
  silo: Address;
  account: Address;
  chainId: number;
  notificationChatId: number;
  notificationThreshold: number;
  language: string;
}

export interface Notification {
  silo: Address;
  chainId: number;
  healthFactor: string;
  blockNumber: number;
  account: Address;
}

export type CommandHandler = (
  chatId: number,
  userId: number,
  args: string[],
  state: State,
  subscriptionManager: ChatSubscriptionManager,
  notificationService: NotificationService
) => Promise<CommandResponse>;

export interface ChatSubscriptionManager {
  listSubscriptionsFromUser(userId: number): Promise<Subscription[]>;
  getSubscription(subscriptionId: string): Promise<Subscription | undefined>;
  listSubscriptionsFromChat(chatId: number): Promise<Subscription[]>;
  listSubscriptions(): Promise<Subscription[]>;
  subscribe(
    chatId: number,
    userId: number,
    state: SubscriptionState
  ): Promise<{ ok: boolean; subscription: Subscription | undefined }>;
  pauseSubscription(subscriptionId: string): Promise<{ ok: boolean }>;
  restartSubscription(subscriptionId: string): Promise<{ ok: boolean }>;
  unsubscribe(subscriptionId: string): Promise<{ ok: boolean }>;
  pauseAll(userId: number): Promise<{ ok: boolean }>;
  restartAll(userId: number): Promise<{ ok: boolean }>;
  unsubscribeAll(userId: number): Promise<{ ok: boolean }>;
  updateSubscriptionSetting(
    subscriptionId: string,
    setting: keyof Subscription,
    value: string | number | boolean
  ): Promise<{ ok: boolean }>;
}

export interface NotificationService {
  handleNotification(db: unknown, notification: Notification): Promise<void>;
  sendMessage(subscription: Subscription, details: Notification): Promise<void>;
}

export const SUPPORTED_CHAINS = {
  MAINNET: 1,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
} as const;

export type SupportedChain =
  (typeof SUPPORTED_CHAINS)[keyof typeof SUPPORTED_CHAINS];

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  DELETED = "DELETED",
}

export interface Transaction {
  hash: string;
  blockNumber: number;
  from: Address;
  to: Address;
  value: string;
  gasPrice: string;
  gasLimit: string;
}

export class InvalidAddressError extends Error {
  constructor(address: string) {
    super(`Invalid Ethereum address: ${address}`);
    this.name = "InvalidAddressError";
  }
}

export class SubscriptionNotFoundError extends Error {
  constructor(subscriptionId: number) {
    super(`Subscription not found: ${subscriptionId}`);
    this.name = "SubscriptionNotFoundError";
  }
}
