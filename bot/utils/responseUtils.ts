import type { KeyboardButton } from "grammy/types";
import type { CommandResponse, State } from "../types";

export function createCommandResponse(
	chatId: number,
	text: string,
	state: State,
	parseMode: "Markdown" | "HTML" = "Markdown",
	replyMarkup?: {
		inline_keyboard?: Array<Array<{ text: string; callback_data: string }>>;
		keyboard?: KeyboardButton[][];
		one_time_keyboard?: boolean;
		resize_keyboard?: boolean;
	},
): CommandResponse {
	return {
		newState: state,
		reply: {
			chatId,
			text,
			parse_mode: parseMode,
			reply_markup: {
				...replyMarkup,
				keyboard: replyMarkup?.keyboard ?? [],
			},
		},
	};
}

export function createInlineKeyboard(
	buttons: Array<Array<{ text: string; callback_data: string }>>,
): { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } {
	return { inline_keyboard: buttons };
}

export function formatMessage(
	text: string,
	parseMode: "Markdown" | "HTML" = "Markdown",
): { text: string; parse_mode: "Markdown" | "HTML" } {
	return { text, parse_mode: parseMode };
}
