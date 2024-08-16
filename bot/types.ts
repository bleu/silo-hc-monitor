import type { chatSubscription, position } from "./db/schema";

export type Position = typeof position.$inferSelect;
export type Subscription = typeof chatSubscription.$inferSelect;

export interface SubscriptionState {
  silo: string;
  account: string;
  chainId: number;
}

export interface Notification {
  silo: string;
  chainId: number;
  healthFactor: string;
  blockNumber: number;
}

export type Action =
  | "user_address"
  | "position_selection"
  | "chain_id"
  | "pauseall"
  | "restartall"
  | "unsubscribeall"
  | "manage_chat"
  | "manage_subscription"
  | "pause_subscription"
  | "restart_subscription"
  | "unsubscribe_subscription"
  | "change_settings"
  | "manage_links"
  | "edit_link_action"
  | "update_min_buy_amount"
  | "update_trade_size_emoji"
  | "update_trade_size_step"
  | "update_language"
  | "set_language";

export interface State {
  step?: Action;
  chatId?: number;
  silo?: string;
  positions?: Position[];
  account?: string;
  chainId?: number;
  updating?: string;
  currentSubscription?: string;
  creatorId?: number;
}
