import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { chatSubscription } from "../db/bot/schema";
import { lower } from "../db/indexing_data/schema";
import type { Subscription, SubscriptionState } from "../types";

export class ChatSubscriptionManager {
	async listSubscriptionsForPosition(
		silo: string,
		chainId: number,
		account: string,
	): Promise<Subscription[]> {
		return db.query.chatSubscription.findMany({
			where: and(
				eq(lower(chatSubscription.silo), silo.toLowerCase()),
				eq(chatSubscription.chainId, chainId),
				eq(lower(chatSubscription.account), account.toLowerCase()),
			),
		});
	}

	async listSubscriptionsFromUser(userId: number): Promise<Subscription[]> {
		return db.query.chatSubscription.findMany({
			where: eq(chatSubscription.creator, userId.toString()),
		});
	}

	async getSubscription(
		subscriptionId: number,
	): Promise<Subscription | undefined> {
		const subscriptions = await db.query.chatSubscription.findMany({
			where: eq(chatSubscription.id, subscriptionId),
			limit: 1,
		});
		return subscriptions[0];
	}

	async listSubscriptionsFromChat(chatId: number): Promise<Subscription[]> {
		return db.query.chatSubscription.findMany({
			where: eq(chatSubscription.chatId, chatId),
		});
	}

	async listSubscriptions(): Promise<Subscription[]> {
		return db.query.chatSubscription.findMany();
	}

	async subscribe(chatId: number, userId: number, state: SubscriptionState) {
		const value = {
			chatId: state.notificationChatId,
			silo: state.silo,
			account: state.account,
			chainId: state.chainId,
			creator: userId.toString(),
			notificationThreshold: state.notificationThreshold,
			paused: 0,
			language: state.language,
			chatTitle: "Unknown",
		};

		const [result] = await db
			.insert(chatSubscription)
			.values(value)
			.returning();
		return { ok: true, subscription: result };
	}

	async pauseSubscription(subscriptionId: number) {
		return { ok: true };
	}

	async restartSubscription(subscriptionId: number) {
		await db
			.update(chatSubscription)
			.set({ paused: 0 })
			.where(eq(chatSubscription.id, subscriptionId));
		return { ok: true };
	}

	async unsubscribe(subscriptionId: number) {
		await db
			.delete(chatSubscription)
			.where(eq(chatSubscription.id, subscriptionId));
		return { ok: true };
	}

	async pauseAll(userId: number) {
		await db
			.update(chatSubscription)
			.set({ paused: 1 })
			.where(eq(chatSubscription.creator, userId.toString()));
		return { ok: true };
	}

	async restartAll(userId: number) {
		await db
			.update(chatSubscription)
			.set({ paused: 0 })
			.where(eq(chatSubscription.creator, userId.toString()));
		return { ok: true };
	}

	async unsubscribeAll(userId: number) {
		await db
			.delete(chatSubscription)
			.where(eq(chatSubscription.creator, userId.toString()));
		return { ok: true };
	}

	async updateSubscriptionSetting(
		subscriptionId: number,
		setting: keyof Subscription,
		value: string | number | boolean,
	) {
		await db
			.update(chatSubscription)
			.set({ [setting]: value })
			.where(eq(chatSubscription.id, subscriptionId));
		return { ok: true };
	}
}
