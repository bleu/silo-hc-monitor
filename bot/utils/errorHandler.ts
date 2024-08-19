import type { Context } from "grammy";
import { MESSAGES } from "../constants";

export class BotError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly originalError?: unknown,
	) {
		super(message);
		this.name = "BotError";
	}
}

export async function handleError(ctx: Context, error: unknown): Promise<void> {
	console.error("Error:", error);

	let message: string;
	if (error instanceof BotError) {
		message = error.message;
		console.error(`Error code: ${error.code}`);
		if (error.originalError) {
			console.error("Original error:", error.originalError);
		}
	} else {
		message = MESSAGES.ERROR_OCCURRED;
	}

	try {
		await sendErrorMessage(ctx, message);
	} catch (sendError) {
		console.error("Failed to send error message to user:", sendError);
	}
}

async function sendErrorMessage(ctx: Context, message: string): Promise<void> {
	if (ctx.callbackQuery) {
		await ctx.answerCallbackQuery(message);
	} else {
		await ctx.reply(message);
	}
}
