import express from "express";
import {
	Bot,
	type Context,
	type InlineKeyboard,
	type Keyboard,
	type SessionFlavor,
	session,
	webhookCallback,
} from "grammy";
import { handleCommand } from "./commands";
import { STATE_TYPES } from "./constants";
import { handleError } from "./utils/errorHandler";

import invariant from "tiny-invariant";
import { db } from "./db";
import { CommandDispatcher, handlers } from "./dispatcher";
import { NotificationService } from "./services/notificationService";
import { ChatSubscriptionManager } from "./services/subscriptionManager";
import { type Command, type State, WatchAction } from "./types";

import { autoRetry } from "@grammyjs/auto-retry";
import type { ForceReply, ReplyKeyboardRemove } from "grammy/types";

type ReplyMarkup = InlineKeyboard | Keyboard | ReplyKeyboardRemove | ForceReply;

function initialState(): State {
	return { type: STATE_TYPES.IDLE };
}
const token = process.env.TELEGRAM_BOT_TOKEN;

invariant(token, "TELEGRAM_BOT_TOKEN is required");

export const bot = new Bot<Context & SessionFlavor<{ state: State }>>(token);

bot.api.config.use(autoRetry());

bot.use(session({ initial: () => ({ state: initialState() }) }));

const subscriptionManager = new ChatSubscriptionManager();
const notificationService = new NotificationService(subscriptionManager);

const validCommands = Object.keys(handlers) as (keyof typeof handlers)[];

bot.command(validCommands, async (ctx) => {
	try {
		invariant(ctx.from?.id, "User ID not found");
		invariant(ctx.message?.text, "Message text not found");

		const [command, ...args] = ctx.message.text.split(" ");
		invariant(command, "Command not found");
		const result = await handleCommand(
			command.replace("/", "") as Command,
			ctx.chat.id,
			ctx.from.id,
			args,
			ctx.session.state,
			subscriptionManager,
			notificationService,
		);

		ctx.session.state = result.newState;
		await ctx.reply(
			result.reply.text,
			result.reply as {
				reply_markup?: ReplyMarkup;
				parse_mode?: "Markdown" | "HTML";
			},
		);
	} catch (error) {
		await handleError(ctx, error);
	}
});

bot.on("message:text", async (ctx) => {
	const subscriptionManager = new ChatSubscriptionManager();

	try {
		const state = ctx.session.state;
		console.log("Received text message. Current state:", state);

		if (state.type === "watch" || state.type === "manage") {
			const { newState, reply } = await CommandDispatcher.handleStep(
				state.data.action,
				ctx.message.text,
				ctx.chat.id,
				ctx.from?.id || 0,
				state,
				subscriptionManager,
			);
			ctx.session.state = newState;

			if (reply) {
				if ("reply_markup" in reply) {
					await ctx.reply(reply.text, {
						reply_markup: reply.reply_markup,
						parse_mode: reply.parse_mode,
					});
				} else {
					await ctx.reply(reply.text, { parse_mode: "Markdown" });
				}
			}
		} else {
			const count = (await db.query.chatSubscription.findMany()).length;
			await ctx.reply(
				`I'm not sure what you mean. Try using a command like /help to get started.`,
			);
		}
	} catch (error) {
		console.error("Error handling text message:", error);
		await ctx.reply("An error occurred while processing your message.");
	}
});

bot.on("callback_query:data", async (ctx) => {
	const subscriptionManager = new ChatSubscriptionManager();

	try {
		const state = ctx.session.state || initialState();
		console.log("Callback query data:", ctx.callbackQuery.data);
		console.log("Current state:", state);

		if (!ctx.chat) {
			throw new Error("Chat not found");
		}

		const { newState, reply } = await CommandDispatcher.handleCallbackQuery(
			ctx.callbackQuery.data,
			ctx.chat,
			ctx.from.id,
			state,
			subscriptionManager,
		);
		ctx.session.state = newState;

		if (reply) {
			if ("new_message" in reply && reply.new_message) {
				await ctx.answerCallbackQuery();
				await ctx.reply(reply.text, reply as { reply_markup?: ReplyMarkup });
			} else if (
				reply.reply_markup &&
				"inline_keyboard" in reply.reply_markup
			) {
				await ctx.editMessageText(reply.text, {
					reply_markup: reply.reply_markup,
					parse_mode: reply.parse_mode,
				});
			} else {
				await ctx.answerCallbackQuery();
				await ctx.reply(reply.text, reply as { reply_markup?: ReplyMarkup });
			}
		}
		await ctx.answerCallbackQuery();
	} catch (error) {
		console.error("Error handling callback query:", error);
		await ctx.answerCallbackQuery(
			"An error occurred while processing your request.",
		);
	}
});

bot.on(":chat_shared", async (ctx) => {
	const subscriptionManager = new ChatSubscriptionManager();

	try {
		const state = ctx.session.state;
		if (
			state.type === "watch" &&
			state.data.action === WatchAction.CHAT_SELECTION
		) {
			const { newState, reply } = await CommandDispatcher.handleStep(
				state.data.action,
				ctx.chat.id.toString(),
				ctx.chat.id,
				ctx?.from?.id,
				state,
				subscriptionManager,
			);
			ctx.session.state = newState;

			if (reply) {
				if ("reply_markup" in reply) {
					await ctx.reply(reply.text, {
						reply_markup: reply.reply_markup,
						parse_mode: "Markdown",
					});
				} else {
					await ctx.reply(reply.text, { parse_mode: "Markdown" });
				}
			}
		}
	} catch (error) {
		console.error("Error handling chat shared:", error);
		await ctx.reply("An error occurred while processing your chat selection.");
	}
});

bot.catch((err) => {
	const ctx = err.ctx;
	console.error(
		`Error while handling update ${ctx.update.update_id}:`,
		err.error,
	);

	ctx
		.reply(
			"An unexpected error occurred. Our team has been notified and we'll look into it.",
		)
		.catch((sendError) => {
			console.error("Failed to send error message to user:", sendError);
		});
});
const endpoint = process.env.TELEGRAM_WEBHOOK_URL;
invariant(endpoint, "TELEGRAM_WEBHOOK_URL is required");

const setWebhook = async () => {
	try {
		await bot.api.setWebhook(`${endpoint}/webhook`);
	} catch (error) {
		console.error("Error setting webhook:", error);
		setTimeout(setWebhook, 2_000);
	}
};

await setWebhook();
console.log(`Bot is running at ${endpoint}`);

const server = express();
server.use(express.json());

server.post("/webhook", webhookCallback(bot, "express"));

server.listen(42069);
