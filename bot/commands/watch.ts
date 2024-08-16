import { eq } from "drizzle-orm";
import { db } from "../db";
import { lower, position } from "../db/schema";
import type { ChatSubscriptionManager } from "../services/subscriptionManager";
import type { Action, State, SubscriptionState } from "../types";
import { chainNameMap, truncateAddress } from "../utils";

type Position = typeof position.$inferSelect;

export async function handlewatch(
	chatId: number,
	userId: number,
	args: string[],
	state: State,
	subscriptionManager: ChatSubscriptionManager,
) {
	const newState = { ...state, step: "user_address" };

	return {
		newState,
		reply: {
			chat_id: chatId,
			text: "Please enter your account address:",
		},
	};
}

export async function handlewatchStep(
	step: Action,
	text: string,
	chatId: number,
	userId: number,
	state: State,
	subscriptionManager: ChatSubscriptionManager,
) {
	switch (step) {
		case "user_address":
			return handleAccount(text, chatId, userId, state);
		case "position_selection":
			return handlePositionSelection(
				text,
				chatId,
				userId,
				state,
				subscriptionManager,
			);
		default:
			return {
				newState: state,
				reply: { chat_id: chatId, text: "Unknown step." },
			};
	}
}

async function handleAccount(
	account: string,
	chatId: number,
	userId: number,
	state: State,
) {
	if (!isValidAddress(account)) {
		return {
			newState: state,
			reply: {
				chat_id: chatId,
				text: "Invalid address. Please try again.",
			},
		};
	}

	const positions = await fetchPositions(account);

	if (positions.length === 0) {
		return {
			newState: state,
			reply: {
				chat_id: chatId,
				text: "No positions found for this address.",
			},
		};
	}

	const buttons = positions.map((position, index) => [
		{
			text: `${
				chainNameMap[position.chainId as keyof typeof chainNameMap]
			} - ${truncateAddress(position.silo)} - Balance: ${position.balance}`,
			callback_data: `position_selection:${index}`,
		},
	]);

	const newState = { ...state, account, step: "position_selection", positions };

	return {
		newState,
		reply: {
			chat_id: chatId,
			text: "Please select a position to track:",
			reply_markup: { inline_keyboard: buttons },
		},
	};
}

async function handlePositionSelection(
	positionIndex: string,
	chatId: number,
	userId: number,
	state: State,
	subscriptionManager: ChatSubscriptionManager,
) {
	const index = Number.parseInt(positionIndex);
	if (
		Number.isNaN(index) ||
		index < 0 ||
		index >= (state.positions?.length ?? 0)
	) {
		return {
			newState: state,
			reply: {
				chat_id: chatId,
				text: "Invalid selection. Please try again.",
			},
		};
	}

	const selectedPosition = state.positions?.[index];

	if (!selectedPosition) {
		return {
			newState: state,
			reply: {
				chat_id: chatId,
				text: "Invalid selection. Please try again.",
			},
		};
	}

	const subscriptionState: SubscriptionState = {
		silo: selectedPosition.silo,
		account: state.account ?? "",
		chainId: selectedPosition.chainId,
	};

	const result = await subscriptionManager.subscribe(
		chatId,
		userId,
		subscriptionState,
	);

	if (result.ok) {
		return {
			newState: { ...state, step: null },
			reply: {
				chat_id: chatId,
				text: "Subscription added successfully!",
			},
		};
	}
	return {
		newState: state,
		reply: {
			chat_id: chatId,
			text: "Failed to add subscription. Please try again.",
		},
	};
}

async function fetchPositions(account: string): Promise<Position[]> {
	return db.query.position.findMany({
		where: eq(lower(position.account), account.toLowerCase()),
	});
}

async function fetchPosition(
	positionId: string,
): Promise<Position | undefined> {
	const positions = await db.query.position.findMany({
		where: eq(position.id, positionId),
		limit: 1,
	});
	return positions[0];
}

function isValidAddress(address: string): boolean {
	return /^0x[a-fA-F0-9]{40}$/.test(address);
}
