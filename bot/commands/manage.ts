// bot/commands/manage.ts

import type {
  ChatSubscriptionManager,
  CommandResponse,
  State,
  Subscription,
  ManageState,
} from "../types";
import { ManageAction, WatchAction, GlobalAction } from "../types";
import { getChainLabel, truncateAddress } from "../utils";
import type { Address } from "viem";
import invariant from "tiny-invariant";

export async function handleManage(
  chatId: number,
  userId: number,
  args: string[],
  state: State,
  subscriptionManager: ChatSubscriptionManager
): Promise<CommandResponse> {
  const subscriptions = await subscriptionManager.listSubscriptionsFromUser(
    userId
  );

  if (subscriptions.length === 0) {
    return {
      newState: {
        type: "manage",
        data: { action: ManageAction.LIST_SUBSCRIPTIONS },
      },
      reply: {
        chatId: chatId,
        text: "You don't have any subscriptions yet. Use /watch to create a new subscription.",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Start Watching",
                callback_data: `watch:${WatchAction.START}`,
              },
            ],
          ],
        },
      },
    };
  }

  const buttons = buildSubscriptionButtons(subscriptions);

  return {
    newState: {
      type: "manage",
      data: {
        action: ManageAction.LIST_SUBSCRIPTIONS,
        subscriptions,
      },
    },
    reply: {
      chatId: chatId,
      text: "📋 *Your Subscriptions*\n\nSelect a subscription to manage:",
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: buttons },
    },
  };
}

export async function handleManageStep(
  action: ManageAction,
  input: string,
  chatId: number,
  userId: number,
  state: ManageState,
  subscriptionManager: ChatSubscriptionManager
): Promise<CommandResponse> {
  switch (action) {
    case ManageAction.LIST_SUBSCRIPTIONS:
      return handleListSubscriptions(chatId, userId, subscriptionManager);
    case ManageAction.SUBSCRIPTION_DETAILS:
      return handleSubscriptionDetails(
        input,
        chatId,
        state,
        subscriptionManager
      );
    case ManageAction.CHANGE_SETTINGS:
      return handleChangeSettings(input, chatId, state);
    case ManageAction.CONFIRM_CHANGES:
      return handleConfirmChanges(input, chatId, state, subscriptionManager);
    case ManageAction.PAUSE_SUBSCRIPTION:
      return handlePauseSubscription(input, chatId, state, subscriptionManager);
    case ManageAction.RESTART_SUBSCRIPTION:
      return handleRestartSubscription(
        input,
        chatId,
        state,
        subscriptionManager
      );
    case ManageAction.UNSUBSCRIBE_SUBSCRIPTION:
      return handleUnsubscribeSubscription(
        input,
        chatId,
        state,
        subscriptionManager
      );
    default:
      return {
        newState: { type: "manage", data: state },
        reply: {
          chatId: chatId,
          text: "❌ Unknown action in manage process.",
          parse_mode: "Markdown",
        },
      };
  }
}

function buildSubscriptionButtons(subscriptions: Subscription[]) {
  const buttons = subscriptions.map((sub) => [
    {
      text: `${getChainLabel(sub.chainId)} - ${truncateAddress(
        sub.silo as Address
      )}`,
      callback_data: `manage:${ManageAction.SUBSCRIPTION_DETAILS}:${sub.id}`,
    },
  ]);

  buttons.push([
    { text: "Pause All", callback_data: `global:${GlobalAction.PAUSE_ALL}` },
    {
      text: "Restart All",
      callback_data: `global:${GlobalAction.RESTART_ALL}`,
    },
  ]);

  buttons.push([
    {
      text: "Unsubscribe from All",
      callback_data: `global:${GlobalAction.UNSUBSCRIBE_ALL}`,
    },
  ]);
  buttons.push([
    {
      text: "Add New Subscription",
      callback_data: `watch:${WatchAction.START}`,
    },
  ]);

  return buttons;
}

async function handleListSubscriptions(
  chatId: number,
  userId: number,
  subscriptionManager: ChatSubscriptionManager
): Promise<CommandResponse> {
  const subscriptions = await subscriptionManager.listSubscriptionsFromUser(
    userId
  );
  const buttons = buildSubscriptionButtons(subscriptions);

  return {
    newState: {
      type: "manage",
      data: {
        action: ManageAction.LIST_SUBSCRIPTIONS,
        subscriptions,
      },
    },
    reply: {
      chatId: chatId,
      text: "📋 *Your Subscriptions*\n\nSelect a subscription to manage:",
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: buttons },
    },
  };
}

async function handleSubscriptionDetails(
  subscriptionId: string,
  chatId: number,
  state: ManageState,
  subscriptionManager: ChatSubscriptionManager
): Promise<CommandResponse> {
  const subscription = await subscriptionManager.getSubscription(
    subscriptionId
  );
  if (!subscription) {
    return {
      newState: { type: "manage", data: state },
      reply: {
        chatId: chatId,
        text: "❌ Subscription not found.",
        parse_mode: "Markdown",
      },
    };
  }

  const details = `
	*Subscription Details*
	Chain: ${getChainLabel(subscription.chainId)}
	Silo: \`${truncateAddress(subscription.silo as Address)}\`
	Account: \`${truncateAddress(subscription.account as Address)}\`
	Status: ${subscription.paused ? "Paused" : "Active"}
	Notification Threshold: ${subscription.notificationThreshold}
	Language: ${subscription.language}
	  `;

  const buttons = [
    [
      {
        text: subscription.paused ? "▶️ Restart" : "⏸ Pause",
        callback_data: `manage:${
          subscription.paused
            ? ManageAction.RESTART_SUBSCRIPTION
            : ManageAction.PAUSE_SUBSCRIPTION
        }:${subscription.id}`,
      },
      {
        text: "🗑️ Unsubscribe",
        callback_data: `manage:${ManageAction.UNSUBSCRIBE_SUBSCRIPTION}:${subscription.id}`,
      },
    ],
    [
      {
        text: "⚙️ Change Settings",
        callback_data: `manage:${ManageAction.CHANGE_SETTINGS}:${subscription.id}`,
      },
    ],
    [
      {
        text: "Back to Subscriptions",
        callback_data: `manage:${ManageAction.LIST_SUBSCRIPTIONS}`,
      },
    ],
  ];

  return {
    newState: {
      type: "manage",
      data: {
        action: ManageAction.SUBSCRIPTION_DETAILS,
        selectedSubscription: subscription,
      },
    },
    reply: {
      chatId: chatId,
      text: details,
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: buttons },
    },
  };
}

async function handleChangeSettings(
  subscriptionId: string,
  chatId: number,
  state: ManageState
): Promise<CommandResponse> {
  const buttons = [
    [
      {
        text: "Change Notification Threshold",
        callback_data: `manage:${ManageAction.CHANGE_SETTINGS}:threshold:${subscriptionId}`,
      },
    ],
    [
      {
        text: "Update Language",
        callback_data: `manage:${ManageAction.CHANGE_SETTINGS}:language:${subscriptionId}`,
      },
    ],
    [
      {
        text: "Back to Subscription",
        callback_data: `manage:${ManageAction.SUBSCRIPTION_DETAILS}:${subscriptionId}`,
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

async function handleConfirmChanges(
  input: string,
  chatId: number,
  state: ManageState,
  subscriptionManager: ChatSubscriptionManager
): Promise<CommandResponse> {
  // Implement the logic to confirm and apply changes
  // ...

  return {
    newState: { type: "manage", data: state },
    reply: {
      chatId: chatId,
      text: "Changes applied successfully.",
      parse_mode: "Markdown",
    },
  };
}

async function handlePauseSubscription(
  subscriptionId: string,
  chatId: number,
  state: ManageState,
  subscriptionManager: ChatSubscriptionManager
): Promise<CommandResponse> {
  await subscriptionManager.pauseSubscription(subscriptionId);
  return {
    newState: { type: "manage", data: state },
    reply: {
      chatId: chatId,
      text: "✅ Subscription paused.",
      parse_mode: "Markdown",
    },
  };
}

async function handleRestartSubscription(
  subscriptionId: string,
  chatId: number,
  state: ManageState,
  subscriptionManager: ChatSubscriptionManager
): Promise<CommandResponse> {
  await subscriptionManager.restartSubscription(subscriptionId);
  return {
    newState: { type: "manage", data: state },
    reply: {
      chatId: chatId,
      text: "✅ Subscription restarted.",
      parse_mode: "Markdown",
    },
  };
}

async function handleUnsubscribeSubscription(
  subscriptionId: string,
  chatId: number,
  state: ManageState,
  subscriptionManager: ChatSubscriptionManager
): Promise<CommandResponse> {
  await subscriptionManager.unsubscribe(subscriptionId);
  return {
    newState: { type: "manage", data: state },
    reply: {
      chatId: chatId,
      text: "✅ Unsubscribed from subscription.",
      parse_mode: "Markdown",
    },
  };
}

export async function handleManageUpdates(
  action: string,
  value: string,
  chatId: number,
  userId: number,
  state: State,
  subscriptionManager: ChatSubscriptionManager
): Promise<CommandResponse> {
  if (state.type !== "manage") {
    return {
      newState: state,
      reply: {
        chatId: chatId,
        text: "❌ Invalid state for manage updates.",
        parse_mode: "Markdown",
      },
    };
  }

  switch (action) {
    case "threshold":
      return handleChangeThreshold(
        value,
        chatId,
        state.data,
        subscriptionManager
      );
    case "language":
      return handleChangeLanguage(
        value,
        chatId,
        state.data,
        subscriptionManager
      );
    default:
      return {
        newState: state,
        reply: {
          chatId: chatId,
          text: "❌ Unknown update action. Please try again.",
          parse_mode: "Markdown",
        },
      };
  }
}

async function handleChangeThreshold(
  value: string,
  chatId: number,
  state: ManageState,
  subscriptionManager: ChatSubscriptionManager
): Promise<CommandResponse> {
  const threshold = Number.parseFloat(value);
  if (isNaN(threshold) || threshold < 0 || threshold > 2) {
    return {
      newState: { type: "manage", data: state },
      reply: {
        chatId: chatId,
        text: "Invalid threshold. Please enter a number between 0 and 2.",
        parse_mode: "Markdown",
      },
    };
  }

  // Update the threshold in the database
  // ...

  return {
    newState: { type: "manage", data: state },
    reply: {
      chatId: chatId,
      text: "Threshold updated successfully.",
      parse_mode: "Markdown",
    },
  };
}

async function handleChangeLanguage(
  value: string,
  chatId: number,
  state: ManageState,
  subscriptionManager: ChatSubscriptionManager
): Promise<CommandResponse> {
  const validLanguages = ["en", "es", "zh"];
  if (!validLanguages.includes(value)) {
    return {
      newState: { type: "manage", data: state },
      reply: {
        chatId: chatId,
        text: "Invalid language. Please select a valid language.",
        parse_mode: "Markdown",
      },
    };
  }

  // Update the language in the database
  // ...

  return {
    newState: { type: "manage", data: state },
    reply: {
      chatId: chatId,
      text: "Language updated successfully.",
      parse_mode: "Markdown",
    },
  };
}
