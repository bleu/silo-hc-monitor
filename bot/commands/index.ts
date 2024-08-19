import type { NotificationService } from "../services/notificationService";
import type { ChatSubscriptionManager } from "../services/subscriptionManager";
import { Command, type CommandResponse, type State } from "../types";
import { handleExample } from "./example";
import { handleHelp } from "./help";
import { handleManage } from "./manage";
import { handleStart } from "./start";
import { handleWatch } from "./watch";

export type CommandHandler = (
	chatId: number,
	userId: number,
	args: string[],
	state: State,
	subscriptionManager: ChatSubscriptionManager,
	notificationService: NotificationService,
) => Promise<CommandResponse>;

const commandHandlers: Record<Command, CommandHandler> = {
	[Command.WATCH]: handleWatch,
	[Command.EXAMPLE]: handleExample,
	[Command.HELP]: handleHelp,
	[Command.START]: handleStart,
	[Command.MANAGE]: handleManage,
};

export function getCommandHandler(command: Command): CommandHandler {
	const handler = commandHandlers[command];
	if (!handler) {
		throw new Error(`Handler for command ${command} not found`);
	}
	return handler;
}

export function handleCommand(
	command: Command,
	...args: Parameters<CommandHandler>
): ReturnType<CommandHandler> {
	const handler = getCommandHandler(command);
	return handler(...args);
}
