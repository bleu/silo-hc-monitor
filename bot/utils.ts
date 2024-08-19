import type { Address } from "viem";
import type {
	ManageAction,
	ManageState,
	Silo,
	State,
	Subscription,
	WatchAction,
	WatchState,
} from "./types";

export const SUPPORTED_CHAINS = {
	MAINNET: 1,
	ARBITRUM: 42161,
	OPTIMISM: 10,
	BASE: 8453,
} as const;

export type SupportedChain =
	(typeof SUPPORTED_CHAINS)[keyof typeof SUPPORTED_CHAINS];

export const chainNameMap = {
	[SUPPORTED_CHAINS.MAINNET]: "Mainnet",
	[SUPPORTED_CHAINS.ARBITRUM]: "Arbitrum",
	[SUPPORTED_CHAINS.OPTIMISM]: "Optimism",
	[SUPPORTED_CHAINS.BASE]: "Base",
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

export function buildTokenLabel(
	tokenAddress: Address,
	chainId: number,
): string {
	const symbol = getTokenSym(tokenAddress, chainId);
	const truncatedAddress = truncateAddress(tokenAddress);
	return symbol ? `${truncatedAddress} (${symbol})` : truncatedAddress;
}

function getTokenSym(tokenAddress: string, chainId: number): string {
	// Implement the logic to fetch token symbol from your database
	// For now, we'll return a placeholder
	return "SYMBOL";
}

export function formatBlockNumber(blockNumber: number): string {
	return blockNumber.toLocaleString();
}

export function truncateAddress(address: string): string {
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getSiloLabel(silo: Silo): string {
	return `${truncateAddress(silo.address as Address)} (${silo.asset})`;
}

export function isValidAddress(address: string): address is Address {
	return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function formatBalance(balance: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "decimal",
		minimumFractionDigits: 2,
		maximumFractionDigits: 6,
	}).format(balance);
}

export function generateRequestId(): number {
	// generatre a random number that doesn't overflow the 32-bit integer limit
	return Math.floor(Math.random() * 1000000000);
}
