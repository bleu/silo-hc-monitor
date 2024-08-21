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
	await ctx.db.borrow.create({
		id: `${event.log.id}-${event.log.address}-${event.args.asset}-${event.args.user}-${ctx.network.chainId}-${event.block.number}`,
		data: {
			chainId: ctx.network.chainId,
			account: event.args.user,
			asset: event.args.asset,
			amount: event.args.amount,
			silo: event.log.address,
			timestamp: event.block.timestamp,
		},
	});

	await ctx.db.position.upsert({
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
	});
});

ponder.on("Silo:Repay", async ({ context: ctx, event }) => {
	await ctx.db.repay.create({
		id: `${event.log.id}-${event.log.address}-${event.args.asset}-${event.args.user}-${ctx.network.chainId}-${event.block.number}`,
		data: {
			chainId: ctx.network.chainId,
			asset: event.args.asset,
			account: event.args.user,
			amount: event.args.amount,
			silo: event.log.address,
			timestamp: event.block.timestamp,
		},
	});

	await ctx.db.position.upsert({
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
	});
});
