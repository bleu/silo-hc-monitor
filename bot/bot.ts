import {
	Bot,
	type Context,
	type InlineKeyboard,
	type Keyboard,
	type SessionFlavor,
} from "grammy";

import invariant from "tiny-invariant";
import type { State } from "./types";

import type { ForceReply, ReplyKeyboardRemove } from "grammy/types";

const token = process.env.TELEGRAM_BOT_TOKEN;

invariant(token, "TELEGRAM_BOT_TOKEN is required");

export const bot = new Bot<Context & SessionFlavor<{ state: State }>>(token);
