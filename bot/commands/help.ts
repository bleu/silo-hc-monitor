import { Command, type State } from "../types";

export async function handleHelp(
	chatId: number,
	userId: number,
	args: string[],
	state: State,
) {
	const generalHelp = `
*Welcome to the Silo Finance Bot!* 🤖

Here's how you can interact with me:

/${Command.START} - Welcome message and initial setup
/${Command.WATCH} [address] - Add a new silo position to track (address is optional)
/${Command.MANAGE} - Manage your subscriptions
/${Command.HELP} [command] - Get detailed information about a specific command
/${Command.EXAMPLE} - Get an example notification message

Use these commands to stay updated on your Silo Finance positions and manage your alert preferences.
`;

	const commandHelp: { [key in Command]: string } = {
		[Command.START]: "Use /start to get a welcome message and set up the bot.",
		[Command.WATCH]:
			"Use /watch [address] to add a new Silo Finance position to track. If you don't provide an address, the bot will ask for it.",
		[Command.MANAGE]:
			"Use /manage to view and modify your existing subscriptions.",
		[Command.HELP]:
			"Use /help [command] to get detailed information about a specific command.",
		[Command.EXAMPLE]:
			"Use /example to see an example of a Silo Finance notification message.",
	};

	if (args.length > 0 && args[0] in Command) {
		const command = args[0] as Command;
		return {
			newState: state,
			reply: {
				chatId: chatId,
				text: `*Help for /${command}*\n\n${commandHelp[command]}`,
				parse_mode: "Markdown",
			},
		};
	}

	return {
		newState: state,
		reply: {
			chatId: chatId,
			text: generalHelp,
			parse_mode: "Markdown",
			reply_markup: {
				inline_keyboard: [
					[{ text: "Start Watching", callback_data: Command.WATCH }],
					[{ text: "Manage Subscriptions", callback_data: Command.MANAGE }],
				],
			},
		},
	};
}
