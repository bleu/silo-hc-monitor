import type { NotificationService } from "../services/notificationService";
import type { Notification, State, Subscription } from "../types";
import { formatSubscriptionSettings } from "../utils";

export async function handleExample(
  chatId: number,
  userId: number,
  args: string[],
  state: State,
  _subscriptionManager: any,
  notificationService: NotificationService,
  _stateManager: any
) {
  const exampleNotification: Notification = {
    silo: "0xExampleSilo",
    chainId: 1,
    healthFactor: "0.1",
    blockNumber: 15000000,
  };

  const subscription: Subscription = {
    id: "exampleId",
    chatId: chatId,
    silo: "0x8ED1609D796345661d36291B411992e85DE7B224",
    account: "0xExampleUser",
    chainId: 1,
    language: "en",
    chatTitle: "Example Chat",
    creator: userId.toString(),
    notificationThreshold: 1.0,
    paused: 0,
  };

  await notificationService.sendMessage(subscription, exampleNotification);

  const settingsMessage = formatSubscriptionSettings(subscription);

  return {
    newState: state,
    reply: {
      text: settingsMessage,
      parse_mode: "Markdown",
    },
  };
}
