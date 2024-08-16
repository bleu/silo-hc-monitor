import { bot } from "../../src/api/index";
import type { Notification, Subscription } from "../types";
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
    subscription: Subscription
  ): boolean {
    return (
      !subscription.paused &&
      notification.silo === subscription.silo &&
      notification.chainId === subscription.chainId
    );
  }

  async sendMessage(subscription: Subscription, details: Notification) {
    const message = this.formatMessage(details, subscription);
    try {
      await bot.api.sendMessage(subscription.chatId, message, {
        parse_mode: "Markdown",
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
      // TODO: Implement retry logic or error reporting
    }
  }

  private formatMessage(
    details: Notification,
    subscription: Subscription
  ): string {
    return `🚨 *Low Health Factor Alert* 🚨
  
Your health factor for silo ${subscription.silo} dropped to *${
      details.healthFactor
    }* at block ${details.blockNumber}.
  
${this.formatActionLinks(details)}
	  `.trim();
  }

  private formatActionLinks(details: Notification): string {
    const positionUrl = `https://app.silo.finance/silo/${details.silo}`;
    const addCollateralUrl = `https://app.silo.finance/silo/${details.silo}`;
    const repayDebtUrl = `https://app.silo.finance/silo/${details.silo}?screen=repay`;

    const links = [
      { label: "View Position", url: positionUrl },
      { label: "Add Collateral", url: addCollateralUrl },
      { label: "Repay Debt", url: repayDebtUrl },
    ];

    return links.map((link) => `[${link.label}](${link.url})`).join(" | ");
  }
}
