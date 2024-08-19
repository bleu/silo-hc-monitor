import { bot } from "../bot";
import type { AccountHealthFactor, Subscription } from "../types";
import { getChainLabel, truncateAddress } from "../utils";
import type { ChatSubscriptionManager } from "./subscriptionManager";

export class NotificationService {
	constructor(private subscriptionManager: ChatSubscriptionManager) {}

	async handleNotification(notification: AccountHealthFactor) {
		const subscriptions =
			await this.subscriptionManager.listSubscriptionsForPosition(
				notification.silo,
				notification.chainId,
				notification.account,
			);

		console.log(`${subscriptions.length} subscriptions found for notification`);
		for (const subscription of subscriptions) {
			if (this.shouldNotify(notification, subscription)) {
				await this.sendMessage(subscription, notification);
			}
		}
	}

	private shouldNotify(
		notification: AccountHealthFactor,
		subscription: Subscription,
	): boolean {
		return (
			!subscription.paused &&
			notification.silo === subscription.silo &&
			notification.chainId === subscription.chainId &&
			notification.healthFactor <= subscription.notificationThreshold
		);
	}

	async sendMessage(subscription: Subscription, details: AccountHealthFactor) {
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
								callback_data: `manage:subscription_details:${subscription.id}`,
							},
						],
					],
				},
			});
		} catch (error) {
			console.error("Failed to send notification:", error);
		}
	}

	private formatMessage(
		details: AccountHealthFactor,
		subscription: Subscription,
	): string {
		return `
🚨 *Low Health Factor Alert* 🚨

Chain: ${getChainLabel(details.chainId)}
Silo: \`${truncateAddress(details.silo)}\`
Account: \`${truncateAddress(subscription.account)}\`

Your health factor dropped to *${details.healthFactor}* at block ${details.block}.

Please take action to avoid liquidation!
    `.trim();
	}

	private getPositionUrl(details: AccountHealthFactor): string {
		return `https://app.silo.finance/silo/${details.silo}?chainId=${details.chainId}`;
	}

	private getAddCollateralUrl(details: AccountHealthFactor): string {
		return `https://app.silo.finance/silo/${details.silo}?chainId=${details.chainId}&screen=deposit`;
	}

	private getRepayDebtUrl(details: AccountHealthFactor): string {
		return `https://app.silo.finance/silo/${details.silo}?chainId=${details.chainId}&screen=repay`;
	}
}
