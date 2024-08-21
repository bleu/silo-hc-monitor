import { eq } from "drizzle-orm";
import { http, type Address, createPublicClient, stringify } from "viem";
import { arbitrum, base, mainnet, optimism } from "viem/chains";
import { SiloLensAbi } from "../../abis/SiloLensAbi";
import { db } from "../db";
import { accountHealthFactor, chatSubscription } from "../db/bot/schema";

const clients = {
	[mainnet.id]: createPublicClient({ chain: mainnet, transport: http() }),
	[optimism.id]: createPublicClient({ chain: optimism, transport: http() }),
	[arbitrum.id]: createPublicClient({ chain: arbitrum, transport: http() }),
	[base.id]: createPublicClient({ chain: base, transport: http() }),
} as const;

const siloLensChainIdMapping = {
	[mainnet.id]: "0x331243a425F7EE2468f0FddCe5cD83f58733Cc1C",
	[optimism.id]: "0xd3De080436b9d38DC315944c16d89C050C414Fed",
	[arbitrum.id]: "0xBDb843c7a7e48Dc543424474d7Aa63b61B5D9536",
	[base.id]: "0x196D312fd81412B6443620Ca81B41103b4E123FD",
} as const;

async function calculateHealthFactorsForBlock(
	chainId: keyof typeof clients,
	blockNumber: bigint,
) {
	const client = clients[chainId];
	const contract = {
		address: siloLensChainIdMapping[chainId],
		abi: SiloLensAbi,
	} as const;

	const subscriptions = await db.query.chatSubscription.findMany({
		where: eq(chatSubscription.chainId, chainId),
	});

	const uniqueSiloAccountCombinations = Array.from(
		new Set(subscriptions.map((s) => `${s.silo}-${s.account}`)),
	);

	const calls = uniqueSiloAccountCombinations.flatMap((combo) => {
		const [silo, account] = combo.split("-") as [Address, Address];
		return [
			{
				...contract,
				functionName: "getUserLTV",
				args: [silo, account],
			},
			{
				...contract,
				functionName: "getUserLiquidationThreshold",
				args: [silo, account],
			},
		];
	});

	let data: bigint[];
	try {
		data = (await client.multicall({
			contracts: calls,
			allowFailure: false,
		})) as bigint[];
	} catch (e) {
		console.error("Error fetching data from SiloLens", e);
		return;
	}

	const accountHealthFactorsToBeCreated = uniqueSiloAccountCombinations
		.flatMap((combo, i) => {
			const [silo, account] = combo.split("-") as [Address, Address];
			const ltv = data[i * 2];
			const liquidationThreshold = data[i * 2 + 1];

			if (!ltv || !liquidationThreshold) {
				return;
			}

			const ltvFloat = Number(ltv) / 10 ** 18;
			const liquidationThresholdFloat = Number(liquidationThreshold) / 10 ** 18;

			const healthFactor = 1 - ltvFloat / liquidationThresholdFloat;

			return {
				id: `${silo}-${account}-${chainId}-${blockNumber}`,
				silo,
				chainId,
				account,
				healthFactor,
				currentLtv: Number(ltv),
				currentLiquidationThreshold: Number(liquidationThreshold),
				block: Number(blockNumber),
			};
		})
		.filter(Boolean);

	if (accountHealthFactorsToBeCreated.length === 0) return;

	// @ts-expect-error
	await db.insert(accountHealthFactor).values(accountHealthFactorsToBeCreated);
}

for (const [chainId, client] of Object.entries(clients)) {
	client.watchBlockNumber({
		emitMissed: true,
		emitOnBegin: true,
		onBlockNumber: async (blockNumber) => {
			console.log(`Block number: ${blockNumber}`);
			await calculateHealthFactorsForBlock(
				chainId as unknown as keyof typeof clients,
				blockNumber,
			);
		},
	});
}
