import type { Subscription } from "./types";

export function generateRequestId(): number {
	return Math.floor(Math.random() * 2147483647);
}

export const chainNameMap = {
	1: "Mainnet",
	42161: "Arbitrum",
	10: "Optimism",
	8453: "Base",
} as const;

export function getChainLabel(chainId: number): string {
	// @ts-expect-error
	if (!chainNameMap[chainId]) {
		return chainId.toString();
	}

	return `${chainNameMap[chainId as keyof typeof chainNameMap]} (${chainId})`;
}

export function formatSubscriptionSettings(subscription: Subscription): string {
	const rows = [
		{ "Chat Title": subscription.chatTitle },
		{ "Silo Address": subscription.silo },
		{ "User Address": subscription.account },
		{
			"Chain ID": getChainLabel(
				subscription.chainId as keyof typeof chainNameMap,
			),
		},
		{ Paused: subscription.paused },
		{ Language: subscription.language },
	];

	const settings = rows
		.map((row) => {
			const entry = Object.entries(row)[0];
			if (entry) {
				const [key, value] = entry;
				return `- *${key}:* ${value}`;
			}
			return "";
		})
		.join("\n");
	return `
	*Subscription Settings*

${settings}
	`;
}

interface Link {
	label: string;
	url: string;
	default?: boolean;
	status: string;
}

export function formatLinks(links: Link[]): string {
	return links
		.map((link) => {
			if (link.default) {
				return `- *${link.label}* (${
					link.default ? "Default" : "Not Default"
				}) (${link.status})`;
			}
			return `- *${link.label}* (${link.status})\n    URL: ${link.url}`;
		})
		.join("\n");
}

export function humanizeValue(value: number | string): string {
	const numValue = typeof value === "string" ? Number.parseFloat(value) : value;
	return addThousandSeparator(numValue.toFixed(6));
}

function addThousandSeparator(numberString: string): string {
	return new Intl.NumberFormat().format(Number(numberString));
}

export function buildTokenLabel(tokenAddress: string, chainId: number): string {
	const symbol = getTokenSym(tokenAddress, chainId);
	const truncatedAddress = truncateAddress(tokenAddress);
	return symbol ? `${truncatedAddress} (${symbol})` : truncatedAddress;
}

export function truncateAddress(address: string): string {
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getTokenSym(tokenAddress: string, chainId: number): string {
	// Implement the logic to fetch token symbol from your database
	// For now, we'll return a placeholder
	return "SYMBOL";
}

export function formatBlockNumber(blockNumber: number): string {
	return blockNumber.toLocaleString();
}
