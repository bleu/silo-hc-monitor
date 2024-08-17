// bot/commands/watch.ts

import { eq } from "drizzle-orm";
import { db } from "../db";
import { lower, position } from "../db/schema";
import type {
  ChatSubscriptionManager,
  CommandResponse,
  Position,
  State,
  SubscriptionState,
  WatchState,
} from "../types";
import { WatchAction } from "../types";
import {
  chainNameMap,
  formatBalance,
  generateRequestId,
  isValidAddress,
  truncateAddress,
} from "../utils";
import type { Address } from "viem";

export async function handleWatch(
  chatId: number,
  userId: number,
  args: string[],
  state: State,
  subscriptionManager: ChatSubscriptionManager
): Promise<CommandResponse> {
  if (args.length > 0) {
    return handleAddressInput(args[0], chatId, userId);
  }

  const newState: State = {
    type: "watch",
    data: { action: WatchAction.START },
  };

  return {
    newState,
    reply: {
      chatId: chatId,
      text: "Please enter your account address, or use /watch [address] to skip this step:",
      parse_mode: "Markdown",
    },
  };
}

async function handleAddressInput(
  address: string,
  chatId: number,
  userId: number
): Promise<CommandResponse> {
  if (!isValidAddress(address)) {
    return {
      newState: { type: "watch", data: { action: WatchAction.START } },
      reply: {
        chatId: chatId,
        text: "❌ Invalid address. Please try again with a valid Ethereum address.",
        parse_mode: "Markdown",
      },
    };
  }

  const positions = await fetchPositions(address);

  if (positions.length === 0) {
    return {
      newState: { type: "watch", data: { action: WatchAction.START } },
      reply: {
        chatId: chatId,
        text: "❌ No positions found for this address. Please check the address and try again.",
        parse_mode: "Markdown",
      },
    };
  }

  return displayPositions(positions, address as Address, chatId);
}

async function displayPositions(
  positions: Position[],
  account: Address,
  chatId: number
): Promise<CommandResponse> {
  const buttons = positions.map((position, index) => [
    {
      text: `${
        chainNameMap[position.chainId as keyof typeof chainNameMap]
      } - ${truncateAddress(position.silo as Address)}`,
      callback_data: `watch:position_selection:${index}`,
    },
  ]);

  const positionList = positions
    .map(
      (pos, index) =>
        `${index + 1}. *Chain:* ${
          chainNameMap[pos.chainId as keyof typeof chainNameMap]
        }
   *Silo:* \`${truncateAddress(pos.silo as Address)}\`
   *Balance:* ${formatBalance(pos.balance)}`
    )
    .join("\n\n");

  const newState: State = {
    type: "watch",
    data: {
      action: WatchAction.POSITION_SELECTION,
      address: account,
      positions,
    },
  };

  return {
    newState,
    reply: {
      chatId: chatId,
      text: `📊 Found the following positions for \`${truncateAddress(
        account
      )}\`:

${positionList}

Please select a position to track:`,
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: buttons },
    },
  };
}

export async function handleWatchStep(
  action: WatchAction,
  input: string,
  chatId: number,
  userId: number,
  state: WatchState,
  subscriptionManager: ChatSubscriptionManager
): Promise<CommandResponse> {
  switch (action) {
    case WatchAction.START:
      return handleAddressInput(input, chatId, userId);
    case WatchAction.ADDRESS_INPUT:
      return handleAddressInput(input, chatId, userId);
    case WatchAction.POSITION_SELECTION:
      return handlePositionSelection(input, chatId, state);
    case WatchAction.CHAT_SELECTION:
      return handleChatSelection(
        input,
        chatId,
        userId,
        state,
        subscriptionManager
      );
    case WatchAction.CONFIRMATION:
      return handleConfirmation(chatId, userId, state, subscriptionManager);
    default:
      return {
        newState: { type: "watch", data: state },
        reply: {
          chatId,
          text: "❌ Unknown step in watch process.",
          parse_mode: "Markdown",
        },
      };
  }
}

async function handlePositionSelection(
  positionIndex: string,
  chatId: number,
  state: WatchState
): Promise<CommandResponse> {
  const index = Number.parseInt(positionIndex);
  if (
    Number.isNaN(index) ||
    index < 0 ||
    index >= (state.positions?.length ?? 0)
  ) {
    return {
      newState: { type: "watch", data: state },
      reply: {
        chatId: chatId,
        text: "❌ Invalid selection. Please try again.",
        parse_mode: "Markdown",
      },
    };
  }

  const selectedPosition = state.positions?.[index];

  if (!selectedPosition) {
    return {
      newState: { type: "watch", data: state },
      reply: {
        chatId: chatId,
        text: "❌ Invalid selection. Please try again.",
        parse_mode: "Markdown",
      },
    };
  }

  const newState: State = {
    type: "watch",
    data: { ...state, action: WatchAction.CHAT_SELECTION, selectedPosition },
  };

  const requestId = generateRequestId();

  return {
    newState,
    reply: {
      chatId: chatId,
      text: "Please select where you want to receive notifications:",
      reply_markup: {
        keyboard: [
          [
            {
              text: "Select Chat",
              request_chat: {
                request_id: requestId,
                chat_is_channel: false,
                bot_is_member: true,
              },
            },
          ],
        ],
        one_time_keyboard: true,
        resize_keyboard: true,
      },
    },
  };
}

async function handleChatSelection(
  input: string,
  chatId: number,
  userId: number,
  state: WatchState,
  subscriptionManager: ChatSubscriptionManager
): Promise<CommandResponse> {
  const selectedChatId = Number(input);
  if (Number.isNaN(selectedChatId)) {
    return {
      newState: { type: "watch", data: state },
      reply: {
        chatId: chatId,
        text: "❌ Invalid chat selection. Please try again.",
        parse_mode: "Markdown",
      },
    };
  }
  return handleConfirmation(
    chatId,
    userId,
    { ...state, selectedChatId },
    subscriptionManager
  );
}

async function handleConfirmation(
  chatId: number,
  userId: number,
  state: WatchState,
  subscriptionManager: ChatSubscriptionManager
): Promise<CommandResponse> {
  if (!state.selectedPosition || !state.address || !state.selectedChatId) {
    return {
      newState: { type: "watch", data: state },
      reply: {
        chatId: chatId,
        text: "❌ Missing required information. Please start over.",
        parse_mode: "Markdown",
      },
    };
  }

  const subscriptionState: SubscriptionState = {
    silo: state.selectedPosition.silo as Address,
    account: state.address,
    chainId: state.selectedPosition.chainId,
    notificationChatId: state.selectedChatId,
    notificationThreshold: 1.0, // Default value
    language: "en", // Default value
  };

  const result = await subscriptionManager.subscribe(
    chatId,
    userId,
    subscriptionState
  );

  if (result.ok) {
    return {
      newState: { type: "idle" },
      reply: {
        chatId: chatId,
        text: "✅ Subscription added successfully!",
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "Manage Subscriptions", callback_data: "manage" }],
            [{ text: "Add Another Subscription", callback_data: "watch" }],
          ],
        },
      },
    };
  }
  return {
    newState: { type: "watch", data: state },
    reply: {
      chatId: chatId,
      text: "❌ Failed to add subscription. Please try again.",
      parse_mode: "Markdown",
    },
  };
}

async function fetchPositions(account: string): Promise<Position[]> {
  return db.query.position.findMany({
    where: eq(lower(position.account), account.toLowerCase()),
  });
}
