import type { State } from "../types";

export async function handleStart(
	chatId: number,
	userId: number,
	args: string[],
	state: State,
) {
	const message = `
*Welcome to the Balancer Buy Bot!*
Use this bot to receive notifications for your silo positions.

Commands:
/watch - Add a new silo to track.
/manage - Manage your existing subscriptions.
/help - Get help with commands.
/example - Get an example message.
    `;

	return {
		newState: state,
		reply: { chat_id: chatId, text: message, parse_mode: "Markdown" },
	};
}
