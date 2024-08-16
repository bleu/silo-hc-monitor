import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { chatSubscription } from "../db/schema";
import type { SubscriptionState } from "../types";

type Subscription = typeof chatSubscription.$inferSelect;

export class ChatSubscriptionManager {
	async listSubscriptionsFromUser(userId: number): Promise<Subscription[]> {
		const subscriptions = await db.query.chatSubscription.findMany({
			where: eq(chatSubscription.creator, userId.toString()),
		});
		return subscriptions;
	}

	async getSubscription(
		subscriptionId: string,
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
			id: uuidv4(),
			chatId,
			silo: state.silo,
			account: state.account,
			chainId: state.chainId,
			creator: userId.toString(),
			notificationThreshold: 1.0,
			paused: 0,
			language: "en",
			chatTitle: "Unknown",
		};

		const [result] = await db
			.insert(chatSubscription)
			.values(value)
			.returning();
		return { ok: true, subscription: result };
	}

	async pauseSubscription(subscriptionId: string) {
		await db
			.update(chatSubscription)
			.set({ paused: 1 })
			.where(eq(chatSubscription.id, subscriptionId));
		return { ok: true };
	}

	async restartSubscription(subscriptionId: string) {
		await db
			.update(chatSubscription)
			.set({ paused: 0 })
			.where(eq(chatSubscription.id, subscriptionId));
		return { ok: true };
	}

	async unsubscribe(subscriptionId: string) {
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
		subscriptionId: string,
		setting: keyof typeof chatSubscription.$inferSelect,
		value: string | number | boolean,
	) {
		await db
			.update(chatSubscription)
			.set({ [setting]: value })
			.where(eq(chatSubscription.id, subscriptionId));
		return { ok: true };
	}
}
