import { bot } from "../bot";
import type { AccountHealthFactor, Subscription } from "../types";
import { getChainLabel, truncateAddress } from "../utils";
import type { ChatSubscriptionManager } from "./subscriptionManager";

export class NotificationService {
	constructor(private subscriptionManager: ChatSubscriptionManager) {}

	async handleNotification(accountHealthFactorUpdate: AccountHealthFactor) {
		const subscriptions =
			await this.subscriptionManager.listSubscriptionsForPosition(
				accountHealthFactorUpdate.silo,
				accountHealthFactorUpdate.chainId,
				accountHealthFactorUpdate.account,
			);

		console.log(
			`${subscriptions.length} subscriptions found for accountHealthFactorUpdate`,
		);
		for (const subscription of subscriptions) {
			if (this.shouldNotify(accountHealthFactorUpdate, subscription)) {
				await this.sendMessage(subscription, accountHealthFactorUpdate);
				await this.subscriptionManager.updateSubscriptionAsNotified(
					subscription.id,
				);
			}
		}
	}

	private shouldNotify(
		accountHealthFactorUpdate: AccountHealthFactor,
		subscription: Subscription,
	): boolean {
		if (
			subscription.paused ||
			subscription.account !== accountHealthFactorUpdate.account ||
			subscription.silo !== accountHealthFactorUpdate.silo ||
			subscription.chainId !== accountHealthFactorUpdate.chainId ||
			subscription.notificationThreshold >
				accountHealthFactorUpdate.healthFactor
		) {
			return false;
		}

		const currentTime = new Date();

		if (subscription.lastNotifiedAt) {
			const elapsedMinutes =
				(currentTime.getTime() - subscription.lastNotifiedAt.getTime()) / 1000;

			console.log({
				elapsedMinutes,
				coolDownSeconds: subscription.coolDownSeconds,
			});

			if (elapsedMinutes < subscription.coolDownSeconds) {
				console.log(
					`Skipping notification for ${subscription.id} due to cool down period`,
				);
				return false;
			}
		}

		return true;
	}

	async sendMessage(subscription: Subscription, details: AccountHealthFactor) {
		const message = this.formatMessage(details, subscription);
		try {
			await bot.api.sendMessage(Number(subscription.chatId), message, {
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
			console.error("Failed to send accountHealthFactorUpdate:", error);
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
