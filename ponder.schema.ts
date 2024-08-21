import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
	silo: p.createTable({
		id: p.string(),
		address: p.string(),
		chainId: p.int(),
		asset: p.string(),
		assetSymbol: p.string().optional(),
	}),
	borrow: p.createTable({
		id: p.string(),
		chainId: p.int(),
		asset: p.string(),
		account: p.string(),
		silo: p.string(),
		amount: p.bigint(),
		timestamp: p.bigint(),
	}),
	repay: p.createTable({
		id: p.string(),
		asset: p.string(),
		chainId: p.int(),
		account: p.string(),
		silo: p.string(),
		amount: p.bigint(),
		timestamp: p.bigint(),
	}),
	position: p.createTable({
		id: p.string(),
		chainId: p.int(),
		account: p.string(),
		silo: p.string(),
		asset: p.string(),
		balance: p.bigint(),
		lastUpdatedBlock: p.bigint(),
		lastUpdatedBlockTimestamp: p.bigint(),
	}),
}));
