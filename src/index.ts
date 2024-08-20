import { ponder } from "@/generated";
import { arbitrum, base, mainnet, optimism } from "viem/chains";
import { SiloLensAbi } from "../abis/SiloLensAbi";

import { erc20Abi } from "abitype/abis";
import { eq, ne, not } from "drizzle-orm";

ponder.on("SiloFactory:NewSiloCreated", async ({ context: ctx, event }) => {
	// const assetSymbol = await ctx.client.readContract({
	// 	abi: erc20Abi,
	// 	address: event.args.asset,
	// 	functionName: "symbol",
	// });

	await ctx.db.silo.create({
		id: `${event.args.silo}-${ctx.network.chainId}`,
		data: {
			chainId: ctx.network.chainId,
			address: event.args.silo,
			asset: event.args.asset,
			// assetSymbol: assetSymbol,
		},
	});
});

ponder.on("Silo:Borrow", async ({ context: ctx, event }) => {
	await Promise.all([
		// ctx.db.silo.upsert({
		// 	id: `${event.log.address}-${ctx.network.chainId}`,
		// 	create: {
		// 		chainId: ctx.network.chainId,
		// 		address: event.log.address,
		// 		asset: event.args.asset,
		// 	},
		// 	update: {
		// 		address: event.log.address,
		// 		chainId: ctx.network.chainId,
		// 		asset: event.args.asset,
		// 	},
		// }),

		ctx.db.borrow.create({
			id: `${event.log.id}-${event.log.address}-${event.args.asset}-${event.args.user}-${ctx.network.chainId}-${event.block.number}`,
			data: {
				chainId: ctx.network.chainId,
				account: event.args.user,
				asset: event.args.asset,
				amount: event.args.amount,
				silo: event.log.address,
				timestamp: event.block.timestamp,
			},
		}),

		ctx.db.position.upsert({
			id: `${event.log.address}-${event.args.asset}-${event.args.user}-${ctx.network.chainId}`,
			create: {
				balance: -event.args.amount,
				chainId: ctx.network.chainId,
				account: event.args.user,
				asset: event.args.asset,
				silo: event.log.address,
				lastUpdatedBlock: event.block.number,
				lastUpdatedBlockTimestamp: event.block.timestamp,
			},
			update: (position) => ({
				balance: position.current.balance - event.args.amount,
				chainId: ctx.network.chainId,
				account: event.args.user,
				asset: event.args.asset,
				silo: event.log.address,
				lastUpdatedBlock: event.block.number,
				lastUpdatedBlockTimestamp: event.block.timestamp,
			}),
		}),
	]);
});

ponder.on("Silo:Repay", async ({ context: ctx, event }) => {
	await Promise.all([
		// ctx.db.silo.upsert({
		// 	id: `${event.log.address}-${ctx.network.chainId}`,
		// 	create: {
		// 		chainId: ctx.network.chainId,
		// 		address: event.log.address,
		// 		asset: event.args.asset,
		// 	},
		// 	update: {
		// 		chainId: ctx.network.chainId,
		// 		address: event.log.address,
		// 		asset: event.args.asset,
		// 	},
		// }),

		ctx.db.repay.create({
			id: `${event.log.id}-${event.log.address}-${event.args.asset}-${event.args.user}-${ctx.network.chainId}-${event.block.number}`,
			data: {
				chainId: ctx.network.chainId,
				asset: event.args.asset,
				account: event.args.user,
				amount: event.args.amount,
				silo: event.log.address,
				timestamp: event.block.timestamp,
			},
		}),

		ctx.db.position.upsert({
			id: `${event.log.address}-${event.args.asset}-${event.args.user}-${ctx.network.chainId}`,
			create: {
				balance: event.args.amount,
				asset: event.args.asset,
				chainId: ctx.network.chainId,
				account: event.args.user,
				silo: event.log.address,
				lastUpdatedBlock: event.block.number,
				lastUpdatedBlockTimestamp: event.block.timestamp,
			},
			update: (position) => ({
				balance: position.current.balance + event.args.amount,
				chainId: ctx.network.chainId,
				account: event.args.user,
				asset: event.args.asset,
				silo: event.log.address,
				lastUpdatedBlock: event.block.number,
				lastUpdatedBlockTimestamp: event.block.timestamp,
			}),
		}),
	]);
});

const siloLensChainIdMapping = {
	[mainnet.id]: "0x331243a425F7EE2468f0FddCe5cD83f58733Cc1C",
	[optimism.id]: "0xd3De080436b9d38DC315944c16d89C050C414Fed",
	[arbitrum.id]: "0xBDb843c7a7e48Dc543424474d7Aa63b61B5D9536",
	[base.id]: "0x196D312fd81412B6443620Ca81B41103b4E123FD",
} as const;

const siloLensBlockMapping = {
	[mainnet.id]: 20368030,
	[optimism.id]: 120481633,
	[arbitrum.id]: 86265292,
	[base.id]: 16262631,
} as const;

ponder.on("AccountHealthUpdate:block", async ({ context: ctx, event }) => {
	if (event.block.number < siloLensBlockMapping[ctx.network.chainId]) {
		return;
	}

	if (!siloLensChainIdMapping[ctx.network.chainId]) {
		throw new Error(
			`No SiloLens contract address for chain ${ctx.network.chainId}`,
		);
	}

	const contract = {
		address: siloLensChainIdMapping[ctx.network.chainId],
		abi: SiloLensAbi,
	} as const;

	const allPositions = await ctx.db.position.findMany({
		where: {
			chainId: ctx.network.chainId,
			balance: {
				not: 0n,
			},
		},
	});

	if (!allPositions.items.length) return;

	const positionPerAccount = allPositions.items.reduce(
		(acc, position) => {
			const key = `${position.silo}-${position.account}-${ctx.network.chainId}`;
			if (!acc[key]) {
				acc[key] = position;
			}
			return acc;
		},
		{} as Record<string, (typeof allPositions.items)[0]>,
	);

	if (!positionPerAccount) return;

	const calls = Object.values(positionPerAccount).flatMap((position) => [
		{
			...contract,
			functionName: "getUserLTV",
			args: [position.silo, position.account],
		},
		{
			...contract,
			functionName: "getUserLiquidationThreshold",
			args: [position.silo, position.account],
		},
	]);

	let data: bigint[];
	try {
		data = (await ctx.client.multicall({
			contracts: calls,
			allowFailure: false,
		})) as bigint[];
	} catch (e) {
		console.error("Error fetching data from SiloLens", e);
		return;
	}

	const accountHealthFactorsToBeCreated = [];

	for (let i = 0; i < data.length; i += 2) {
		const position = Object.values(positionPerAccount)[i / 2];
		if (!position) {
			continue;
		}
		const ltv = data[i];
		const liquidationThreshold = data[i + 1];

		if (!ltv || !liquidationThreshold) {
			continue;
		}

		const ltvFloat = Number(ltv) / 10 ** 18;
		const liquidationThresholdFloat = Number(liquidationThreshold) / 10 ** 18;

		const healthFactor = 1 - ltvFloat / liquidationThresholdFloat;

		accountHealthFactorsToBeCreated.push({
			id: `${position.silo}-${position.account}-${position.asset}-${ctx.network.chainId}-${event.block.number}`,
			silo: position.silo,
			chainId: ctx.network.chainId,
			account: position.account,
			healthFactor: healthFactor,
			currentLtv: ltv,
			currentLiquidationThreshold: liquidationThreshold,
			block: event.block.number,
			blockTimestamp: event.block.timestamp,
		});
	}

	await ctx.db.accountHealthFactor.createMany({
		data: accountHealthFactorsToBeCreated,
	});
});
