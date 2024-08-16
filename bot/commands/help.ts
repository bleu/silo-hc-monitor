import type { State } from "../types";

export async function handleHelp(
	chatId: number,
	userId: number,
	args: string[],
	state: State,
) {
	const message = `
*Welcome to the Balancer Buy Bot!* Here's how you can interact with me:

- */start*: Welcome message and initial setup.
- */addtoken*: Begin the process to add a new token for buy alerts.
- */manage*: Manage your subscriptions. You can pause, restart, or unsubscribe from individual or all subscriptions.
- */help [command]*: Get detailed information about a specific command.
- */example*: Get an example message.

Use these commands to stay updated on token trades and manage your alert preferences.
    `;
	return {
		newState: state,
		reply: { chat_id: chatId, text: message, parse_mode: "Markdown" },
	};
}
