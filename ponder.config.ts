import { createConfig, loadBalance, rateLimit } from "@ponder/core";
import { parseAbiItem } from "abitype";
import { http, webSocket } from "viem";

import { SiloAbi } from "./abis/SiloAbi";
import { SiloFactoryAbi } from "./abis/SiloFactoryAbi";
import { arbitrum, base, mainnet, optimism } from "viem/chains";

const siloFactoryEvent = parseAbiItem(
	"event NewSiloCreated(address indexed silo, address indexed asset, uint128 version)",
);

const START_BLOCKS = {
	[mainnet.id]: 20_367_992,
	[optimism.id]: 120_480_601,
	// [arbitrum.id]: 51_894_508,
	[arbitrum.id]: 86_265_292,
	[base.id]: 16_262_586,
} as const;

const SECONDS_INTERVAL = 12 * 60;

const BLOCK_TIMES = {
	[mainnet.id]: 12,
	[optimism.id]: 2,
	[arbitrum.id]: 0.2,
	[base.id]: 2,
} as const;

export default createConfig({
	database: {
		kind: "postgres",
		schema: "indexing_data",
	},
	networks: {
		mainnet: {
			chainId: mainnet.id,
			maxRequestsPerSecond: 500,
			transport: http(process.env.PONDER_RPC_URL_MAINNET),
		},
		optimism: {
			chainId: optimism.id,
			maxRequestsPerSecond: 500,
			transport: http(process.env.PONDER_RPC_URL_OPTIMISM),
		},
		arbitrum: {
			chainId: arbitrum.id,
			maxRequestsPerSecond: 500,
			transport: http(process.env.PONDER_RPC_URL_ARBITRUM),
		},
		base: {
			chainId: base.id,
			maxRequestsPerSecond: 500,
			transport: http(process.env.PONDER_RPC_URL_BASE),
		},
	},
	contracts: {
		SiloFactory: {
			abi: SiloFactoryAbi,
			network: {
				mainnet: {
					address: "0xB7d391192080674281bAAB8B3083154a5f64cd0a",
					startBlock: START_BLOCKS[mainnet.id],
				},
				optimism: {
					address: "0x6B14c4450a29Dd9562c20259eBFF67a577b540b9",
					startBlock: START_BLOCKS[optimism.id],
				},
				arbitrum: {
					address: "0x4166487056A922D784b073d4d928a516B074b719",
					startBlock: START_BLOCKS[arbitrum.id],
				},
				base: {
					address: "0x408822E4E8682413666809b0655161093cd36f2b",
					startBlock: START_BLOCKS[base.id],
				},
			},
		},
		Silo: {
			abi: SiloAbi,
			network: {
				mainnet: {
					factory: {
						address: "0xB7d391192080674281bAAB8B3083154a5f64cd0a",
						event: siloFactoryEvent,
						parameter: "silo",
					},
					startBlock: START_BLOCKS[mainnet.id],
				},
				optimism: {
					factory: {
						address: "0x6B14c4450a29Dd9562c20259eBFF67a577b540b9",
						event: siloFactoryEvent,
						parameter: "silo",
					},
					startBlock: START_BLOCKS[optimism.id],
				},
				arbitrum: {
					factory: {
						address: "0x4166487056A922D784b073d4d928a516B074b719",
						event: siloFactoryEvent,
						parameter: "silo",
					},
					startBlock: START_BLOCKS[arbitrum.id],
				},
				base: {
					factory: {
						address: "0x408822E4E8682413666809b0655161093cd36f2b",
						event: siloFactoryEvent,
						parameter: "silo",
					},
					startBlock: START_BLOCKS[base.id],
				},
			},
		},
	},
	blocks: {
		AccountHealthUpdate: {
			network: {
				mainnet: {
					startBlock: START_BLOCKS[mainnet.id],
					interval: Math.floor(SECONDS_INTERVAL / BLOCK_TIMES[mainnet.id]),
				},
				optimism: {
					startBlock: START_BLOCKS[optimism.id],
					interval: Math.floor(SECONDS_INTERVAL / BLOCK_TIMES[optimism.id]),
				},
				arbitrum: {
					// siloLens was only deployed on arbitrum on block 86265292, so there's no need to check before that
					startBlock: 86_265_292,
					interval: Math.floor(SECONDS_INTERVAL / BLOCK_TIMES[arbitrum.id]),
				},
				base: {
					startBlock: START_BLOCKS[base.id],
					interval: Math.floor(SECONDS_INTERVAL / BLOCK_TIMES[base.id]),
				},
			},
		},
	},
});
