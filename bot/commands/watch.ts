import { eq } from "drizzle-orm";
import type { Address } from "viem";
import type { CommandHandler } from ".";
import { BUTTONS, CHAIN_NAMES, MESSAGES, STATE_TYPES } from "../constants";
import { db } from "../db";
import { accountHealthFactor } from "../db/bot/schema";
import { lower, position } from "../db/indexing_data/schema";
import type { ChatSubscriptionManager } from "../services/subscriptionManager";
import {
	type CommandResponse,
	type Position,
	type State,
	type SubscriptionState,
	WatchAction,
	type WatchState,
} from "../types";
import {
	formatBalance,
	generateRequestId,
	isValidAddress,
	truncateAddress,
} from "../utils";
import { BotError } from "../utils/errorHandler";
import { createCommandResponse } from "../utils/responseUtils";
import { createState } from "../utils/stateManager";

export const handleWatch: CommandHandler = async (
	chatId: number,
	userId: number,
	args: string[],
	state: State,
	subscriptionManager: ChatSubscriptionManager,
): Promise<CommandResponse> => {
	try {
		if (args.length > 0 && args[0]) {
			return handleAddressInput(args[0], chatId, userId);
		}
		return promptForAddress(chatId);
	} catch (error) {
		throw new BotError(
			"Failed to handle watch command",
			"WATCH_COMMAND_ERROR",
			error,
		);
	}
};

function promptForAddress(chatId: number): CommandResponse {
	return createCommandResponse(
		chatId,
		MESSAGES.ENTER_ADDRESS,
		createState(STATE_TYPES.WATCH, { action: WatchAction.ADDRESS_INPUT }),
		"Markdown",
	);
}

async function handleAddressInput(
	address: string,
	chatId: number,
	userId: number,
): Promise<CommandResponse> {
	if (!isValidAddress(address)) {
		return createCommandResponse(
			chatId,
			MESSAGES.INVALID_ADDRESS,
			createState(STATE_TYPES.WATCH, { action: WatchAction.ADDRESS_INPUT }),
			"Markdown",
		);
	}

	const positions = await fetchPositions(address);

	if (positions.length === 0) {
		return createCommandResponse(
			chatId,
			MESSAGES.NO_POSITIONS_FOUND,
			createState(STATE_TYPES.WATCH, { action: WatchAction.ADDRESS_INPUT }),
			"Markdown",
		);
	}

	return displayPositions(positions, address as Address, chatId);
}

export async function handleWatchStep(
	fullAction: WatchAction,
	input: string,
	chatId: number,
	userId: number,
	state: WatchState,
	subscriptionManager: ChatSubscriptionManager,
): Promise<CommandResponse> {
	const action = fullAction.split(":").slice(0, 2).join(":");
	console.log({ action });
	switch (action) {
		case WatchAction.START:
			return promptForAddress(chatId);
		case WatchAction.ADDRESS_INPUT:
			return handleAddressInput(input, chatId, userId);
		case WatchAction.POSITION_SELECTION:
			return handlePositionSelection(state.params?.[0] ?? input, chatId, state);
		case WatchAction.INTERVAL_INPUT:
			return handleCoolDownPeriodInput(input, chatId, state);
		case WatchAction.CHAT_SELECTION:
			return handleChatSelection(
				input,
				chatId,
				userId,
				state,
				subscriptionManager,
			);
		case WatchAction.THRESHOLD_SELECTION:
			return handleThresholdSelection(input, chatId, state);
		case WatchAction.CONFIRMATION:
			return handleConfirmation(chatId, userId, state, subscriptionManager);
		default:
			return createCommandResponse(
				chatId,
				MESSAGES.UNKNOWN_STEP,
				createState(STATE_TYPES.WATCH, state),
				"Markdown",
			);
	}
}

async function displayPositions(
	positions: Position[],
	account: Address,
	chatId: number,
): Promise<CommandResponse> {
	const healthFactors = await db.query.accountHealthFactor.findMany({
		where: eq(lower(accountHealthFactor.account), account.toLowerCase()),
	});

	const buttons = positions.map((position, index) => [
		{
			text: `${CHAIN_NAMES[position.chainId as keyof typeof CHAIN_NAMES]} - ${truncateAddress(position.silo as Address)}`,
			callback_data: `${WatchAction.POSITION_SELECTION}:${index}`,
		},
	]);

	const positionList = positions
		.map((pos, index) => {
			const healthFactor = healthFactors.find(
				(hf) => hf.chainId === pos.chainId && hf.silo === pos.silo,
			);
			return `${index + 1}. *Chain:* ${CHAIN_NAMES[pos.chainId as keyof typeof CHAIN_NAMES]}
	 *Silo:* \`${truncateAddress(pos.silo as Address)}\`
	 *Current Health Factor:* ${healthFactor ? healthFactor.healthFactor.toFixed(2) : "N/A"}`;
		})
		.join("\n\n");

	const newState: State = {
		type: "watch",
		data: {
			action: WatchAction.POSITION_SELECTION,
			address: account,
			positions,
		},
	};

	return createCommandResponse(
		chatId,
		`📊 Found the following positions for \`${truncateAddress(account)}\`:
  
  ${positionList}
  
  Please select a position to track:`,
		newState,
		"Markdown",
		{ inline_keyboard: buttons },
	);
}

async function handlePositionSelection(
	positionIndex: string,
	chatId: number,
	state: WatchState,
): Promise<CommandResponse> {
	const index = Number.parseInt(positionIndex);
	if (
		Number.isNaN(index) ||
		index < 0 ||
		index >= (state.positions?.length ?? 0)
	) {
		return createCommandResponse(
			chatId,
			MESSAGES.INVALID_SELECTION,
			createState(STATE_TYPES.WATCH, state),
			"Markdown",
		);
	}

	const selectedPosition = state.positions?.[index];

	if (!selectedPosition) {
		return createCommandResponse(
			chatId,
			MESSAGES.INVALID_SELECTION,
			createState(STATE_TYPES.WATCH, state),
			"Markdown",
		);
	}

	const newState: State = createState(STATE_TYPES.WATCH, {
		...state,
		action: WatchAction.THRESHOLD_SELECTION,
		selectedPosition,
	});

	return createCommandResponse(
		chatId,
		"Please enter the health factor threshold for notifications (e.g., 1.5):",
		newState,
		"Markdown",
	);
}

async function handleThresholdSelection(
	input: string,
	chatId: number,
	state: WatchState,
): Promise<CommandResponse> {
	const threshold = Number.parseFloat(input);
	if (Number.isNaN(threshold) || threshold <= 0) {
		return createCommandResponse(
			chatId,
			"Invalid threshold. Please enter a positive number.",
			createState(STATE_TYPES.WATCH, {
				...state,
				action: WatchAction.THRESHOLD_SELECTION,
			}),
			"Markdown",
		);
	}

	const newState: State = createState(STATE_TYPES.WATCH, {
		...state,
		action: WatchAction.INTERVAL_INPUT,
		selectedThreshold: threshold,
	});

	return createCommandResponse(
		chatId,
		MESSAGES.ENTER_INTERVAL,
		newState,
		"Markdown",
	);
}

async function handleCoolDownPeriodInput(
	input: string,
	chatId: number,
	state: WatchState,
): Promise<CommandResponse> {
	const interval = Number.parseInt(input);
	if (Number.isNaN(interval) || interval < 60) {
		return createCommandResponse(
			chatId,
			"Invalid notifications interval. Please enter a positive number.",
			createState(STATE_TYPES.WATCH, state),
			"Markdown",
		);
	}

	const newState: State = createState(STATE_TYPES.WATCH, {
		...state,
		selectedCoolDownPeriod: interval,
		action: WatchAction.CHAT_SELECTION,
	});

	const requestId = generateRequestId();

	return createCommandResponse(
		chatId,
		MESSAGES.SELECT_CHAT,
		newState,
		"Markdown",
		{
			keyboard: [
				[
					{
						text: BUTTONS.SELECT_CHAT,
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
	);
}

async function handleConfirmation(
	chatId: number,
	userId: number,
	state: WatchState,
	subscriptionManager: ChatSubscriptionManager,
): Promise<CommandResponse> {
	if (
		!state.selectedPosition ||
		!state.address ||
		!state.selectedChatId ||
		!state.selectedThreshold
	) {
		return createCommandResponse(
			chatId,
			"❌ Missing required information. Please start over.",
			{ type: "watch", data: state },
			"Markdown",
		);
	}

	const subscriptionState: SubscriptionState = {
		silo: state.selectedPosition.silo as Address,
		account: state.address,
		chainId: state.selectedPosition.chainId,
		notificationChatId: state.selectedChatId,
		notificationThreshold: state.selectedThreshold,
		coolDownPeriod: state.selectedCoolDownPeriod ?? 60,
		language: "en", // Default value
	};

	const result = await subscriptionManager.subscribe(
		chatId,
		userId,
		subscriptionState,
	);

	if (result.ok) {
		return createCommandResponse(
			chatId,
			"✅ Subscription added successfully!",
			{ type: "idle" },
			"Markdown",
			{
				inline_keyboard: [
					[{ text: "Manage Subscriptions", callback_data: "manage" }],
					[{ text: "Add Another Subscription", callback_data: "watch" }],
				],
			},
		);
	}
	return createCommandResponse(
		chatId,
		"❌ Failed to add subscription. Please try again.",
		{ type: "watch", data: state },
		"Markdown",
	);
}

async function handleChatSelection(
	input: string,
	chatId: number,
	userId: number,
	state: WatchState,
	subscriptionManager: ChatSubscriptionManager,
): Promise<CommandResponse> {
	const selectedChatId = Number(input);
	if (Number.isNaN(selectedChatId)) {
		return createCommandResponse(
			chatId,
			"❌ Invalid chat selection. Please try again.",
			{ type: "watch", data: state },
			"Markdown",
		);
	}
	return handleConfirmation(
		chatId,
		userId,
		{ ...state, selectedChatId },
		subscriptionManager,
	);
}

async function fetchPositions(account: string): Promise<Position[]> {
	return db.query.position.findMany({
		where: eq(lower(position.account), account.toLowerCase()),
	});
}
