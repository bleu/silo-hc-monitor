import type { Address } from "abitype";
import { bot } from "../../src/api/index";
import type { Notification, Subscription } from "../types";
import { getChainLabel, truncateAddress } from "../utils";
import type { ChatSubscriptionManager } from "./subscriptionManager";

export class NotificationService {
	constructor(private subscriptionManager: ChatSubscriptionManager) {}

	async handleNotification(db: unknown, notification: Notification) {
		const subscriptions = await this.subscriptionManager.listSubscriptions();

		for (const subscription of subscriptions) {
			if (this.shouldNotify(notification, subscription)) {
				await this.sendMessage(subscription, notification);
			}
		}
	}

	private shouldNotify(
		notification: Notification,
		subscription: Subscription,
	): boolean {
		return (
			!subscription.paused &&
			notification.silo === subscription.silo &&
			notification.chainId === subscription.chainId &&
			Number.parseFloat(notification.healthFactor) <=
				subscription.notificationThreshold
		);
	}

	async sendMessage(subscription: Subscription, details: Notification) {
		const message = this.formatMessage(details, subscription);
		try {
			await bot.api.sendMessage(subscription.chatId, message, {
				parse_mode: "Markdown",
				reply_markup: {
					inline_keyboard: [
						[{ text: "View Position", url: this.getPositionUrl(details) }],
						[
							{
								text: "Add Collateral",
								url: this.getAddCollateralUrl(details),
							},
						],
						[{ text: "Repay Debt", url: this.getRepayDebtUrl(details) }],
						[
							{
								text: "Manage Subscription",
								callback_data: `manage_sub:${subscription.id}`,
							},
						],
					],
				},
			});
		} catch (error) {
			console.error("Failed to send notification:", error);
			// TODO: Implement retry logic or error reporting
		}
	}

	private formatMessage(
		details: Notification,
		subscription: Subscription,
	): string {
		return `
🚨 *Low Health Factor Alert* 🚨

Chain: ${getChainLabel(details.chainId)}
Silo: \`${truncateAddress(details.silo)}\`
Account: \`${truncateAddress(subscription.account as Address)}\`

Your health factor dropped to *${details.healthFactor}* at block ${
			details.blockNumber
		}.

Please take action to avoid liquidation!
    `.trim();
	}

	private getPositionUrl(details: Notification): string {
		return `https://app.silo.finance/silo/${details.silo}?chainId=${details.chainId}`;
	}

	private getAddCollateralUrl(details: Notification): string {
		return `https://app.silo.finance/silo/${details.silo}?chainId=${details.chainId}&screen=deposit`;
	}

	private getRepayDebtUrl(details: Notification): string {
		return `https://app.silo.finance/silo/${details.silo}?chainId=${details.chainId}&screen=repay`;
	}
}
