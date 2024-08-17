import { ponder } from "@/generated";
import {
	Bot,
	Composer,
	type Context,
	GrammyError,
	HttpError,
	type SessionFlavor,
	session,
	webhookCallback,
} from "grammy";

import invariant from "tiny-invariant";
import { db } from "../../bot/db";
import { CommandDispatcher, handlers } from "../../bot/dispatcher";
import { NotificationService } from "../../bot/services/notificationService";
import { ChatSubscriptionManager } from "../../bot/services/subscriptionManager";
import type { State } from "../../bot/types";

import type {
	ForceReply,
	InlineKeyboardMarkup,
	ReplyKeyboardMarkup,
	ReplyKeyboardRemove,
} from "grammy/types";
type ReplyMarkup = InlineKeyboard | Keyboard | ReplyKeyboardRemove | ForceReply;

const token = process.env.TELEGRAM_BOT_TOKEN;
const endpoint = process.env.TELEGRAM_WEBHOOK_URL;

invariant(token, "TELEGRAM_BOT_TOKEN is required");
invariant(endpoint, "TELEGRAM_WEBHOOK_URL is required");

interface SessionData {
	state: State;
}

type MyContext = Context & SessionFlavor<SessionData>;

export const bot = new Bot<MyContext>(token);

// await bot.api.setWebhook(endpoint);

function initial(): SessionData {
	return {
		state: {
			step: undefined,
			chatId: undefined,
			silo: undefined,
			account: undefined,
			chainId: undefined,
			updating: undefined,
			currentSubscription: undefined,
			creatorId: undefined,
		},
	};
}

async function sendMessage(
	chatId: number,
	text: string,
	options?: {
		parse_mode?: "Markdown" | "HTML";
		reply_markup?:
			| ReplyKeyboardRemove
			| ForceReply
			| InlineKeyboardMarkup
			| ReplyKeyboardMarkup;
	},
) {
	try {
		await bot.api.sendMessage(chatId, text, options);
	} catch (error) {
		console.error("Failed to send message:", error);
		// Implement error handling or retry logic here
	}
}

const composer = new Composer(session({ initial }));
bot.use(composer);

const cb = webhookCallback(bot, "hono");

ponder.use("/", async (c, next) => {
	await cb(c);
	return await next();
});

const validCommands = Object.keys(handlers) as (keyof typeof handlers)[];

bot.command(validCommands, async (ctx) => {
	invariant(ctx.from?.id, "User ID not found");
	ctx.session.state.chatId = ctx.chat.id;

	const subscriptionManager = new ChatSubscriptionManager();
	const notificationService = new NotificationService(subscriptionManager);

	try {
		const command = ctx.message?.text?.split(" ")[0]?.replace("/", "") ?? "";

		invariant(command, "Command not found");

		const handler = handlers[command as keyof typeof handlers];
		invariant(handler, `Command handler not found for ${command}`);
		invariant(ctx.message?.text, "Message text not found");

		const result = await handler(
			ctx.chat.id,
			ctx.from.id,
			ctx.message.text.split(" ").slice(1),
			ctx.session.state,
			subscriptionManager,
			notificationService,
		);

		ctx.session.state = result.newState;
		await ctx.reply(
			result.reply.text,
			result.reply as { reply_markup?: ReplyMarkup },
		);
	} catch (error) {
		console.error("Error handling command:", error);
		await ctx.reply("An error occurred while processing your command.");
	}
});

bot.on("message:text", async (ctx) => {
	const subscriptionManager = new ChatSubscriptionManager();

	try {
		const state = ctx.session.state;
		if (state.step) {
			const { newState, reply } = await CommandDispatcher.handleStep(
				state.step,
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
						parse_mode: "Markdown",
					});
				} else {
					await ctx.reply(reply.text, { parse_mode: "Markdown" });
				}
			}
		} else {
			const count = (await db.query.chatSubscription.findMany()).length;
			await ctx.reply(
				`I'm not sure what you mean. Try using a command like /help to get started. Silo count: ${count}`,
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
		const state = ctx.session.state;
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
				// For new messages, we can use any type of reply markup
				await ctx.answerCallbackQuery();
				await ctx.reply(reply.text, reply as { reply_markup?: ReplyMarkup });
			} else if (
				reply.reply_markup &&
				"inline_keyboard" in reply.reply_markup
			) {
				// For editing messages, we can only use inline keyboards
				await ctx.editMessageText(reply.text, {
					reply_markup: reply.reply_markup,
					parse_mode: reply.parse_mode,
				});
			} else {
				// If it's not a new message and doesn't have an inline keyboard,
				// we should send a new message instead of editing
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
		if (state.step === "select_chat") {
			const { newState, reply } = await CommandDispatcher.handleStep(
				state.step,
				ctx.chat.id.toString(),
				ctx.chat.id,
				ctx.from.id,
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
	console.error(`Error while handling update ${ctx.update.update_id}:`);
	const e = err.error;
	if (e instanceof GrammyError) {
		console.error("Error in request:", e.description);
	} else if (e instanceof HttpError) {
		console.error("Could not contact Telegram:", e);
	} else {
		console.error("Unknown error:", e);
	}
});

ponder.post("/", async (ctx) => {
	return ctx.text("OK");
});
