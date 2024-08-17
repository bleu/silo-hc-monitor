// bot/dispatcher.ts

import type { Chat } from "grammy/types";
import invariant from "tiny-invariant";
import { handleExample } from "./commands/example";
import { handleHelp } from "./commands/help";
import { handleManage, handleManageStep } from "./commands/manage";
import { handleStart } from "./commands/start";
import { handleWatch, handleWatchStep } from "./commands/watch";
import {
  type Action,
  type ChatSubscriptionManager,
  Command,
  type CommandHandler,
  type CommandResponse,
  GlobalAction,
  ManageAction,
  type NotificationService,
  SettingsAction,
  type State,
  WatchAction,
} from "./types";

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
    notificationService: NotificationService
  ): Promise<CommandResponse> {
    const handler = handlers[command];

    if (handler) {
      return await handler(
        chatId,
        userId,
        args,
        state,
        subscriptionManager,
        notificationService
      );
    }

    return {
      newState: state,
      reply: {
        text: "❌ Unknown command. Please type /help for a list of available commands.",
        parse_mode: "Markdown",
      },
    };
  },

  async handleStep(
    action: Action,
    input: string,
    chatId: number,
    userId: number,
    state: State,
    subscriptionManager: ChatSubscriptionManager
  ): Promise<CommandResponse> {
    switch (state.type) {
      case "watch":
        return handleWatchStep(
          action as WatchAction,
          input,
          chatId,
          userId,
          state.data,
          subscriptionManager
        );
      case "manage":
        return handleManageStep(
          action as ManageAction,
          input,
          chatId,
          userId,
          state.data,
          subscriptionManager
        );
      case "settings":
        // Implement settings handling
        throw new Error("Settings handling not implemented");
      case "idle":
        if (Object.values(GlobalAction).includes(action as GlobalAction)) {
          // Implement global action handling
          throw new Error("Global action handling not implemented");
        }
        return {
          newState: state,
          reply: {
            chatId,
            text: "Invalid action for current state.",
            parse_mode: "Markdown",
          },
        };
    }
  },

  async handleCallbackQuery(
    data: string,
    chat: Chat,
    userId: number,
    state: State,
    subscriptionManager: ChatSubscriptionManager
  ): Promise<CommandResponse> {
    invariant(chat, "Chat not found");
    const [actionType, actionValue, ...params] = data.split(":");
    let action: Action;

    switch (actionType) {
      case "watch":
        action = WatchAction[actionValue as keyof typeof WatchAction];
        break;
      case "manage":
        action = ManageAction[actionValue as keyof typeof ManageAction];
        break;
      case "settings":
        action = SettingsAction[actionValue as keyof typeof SettingsAction];
        break;
      case "global":
        action = GlobalAction[actionValue as keyof typeof GlobalAction];
        break;
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }

    return this.handleStep(
      action,
      params.join(":"),
      chat.id,
      userId,
      state,
      subscriptionManager
    );
  },
};
