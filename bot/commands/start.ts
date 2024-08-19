import type { CommandHandler } from ".";
import type { State } from "../types";
import { createCommandResponse } from "../utils/responseUtils";

export const handleStart: CommandHandler = async (
	chatId: number,
	userId: number,
	args: string[],
	state: State,
) => {
	const message = `
*Welcome to the Silo Finance Bot!*
Use this bot to receive notifications for your Silo Finance positions.

Commands:
/watch - Add a new Silo Finance position to track.
/manage - Manage your existing subscriptions.
/help - Get help with commands.
/example - Get an example notification message.
	`;

	return createCommandResponse(chatId, message, state, "Markdown");
};
