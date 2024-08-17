import { createConfig, loadBalance, rateLimit } from "@ponder/core";
import { parseAbiItem } from "abitype";
import { http, webSocket } from "viem";

import { SiloAbi } from "./abis/SiloAbi";
import { SiloFactoryAbi } from "./abis/SiloFactoryAbi";
import { arbitrum, base, mainnet, optimism } from "viem/chains";

const siloFactoryEvent = parseAbiItem(
  "event NewSiloCreated(address indexed silo, address indexed asset, uint128 version)"
);

const START_BLOCKS = {
  [mainnet.id]: 20_367_992,
  [optimism.id]: 120_480_601,
  // [arbitrum.id]: 51_894_508,
  [arbitrum.id]: 86265292,
  [base.id]: 16_262_586,
} as const;

// transport: loadBalance([
//   http("https://cloudflare-eth.com"),
//   http("https://eth-mainnet.public.blastapi.io"),
//   webSocket("wss://ethereum-rpc.publicnode.com"),
//   rateLimit(http("https://rpc.ankr.com/eth"), { requestsPerSecond: 5 }),
// ]),

export default createConfig({
  networks: {
    mainnet: {
      chainId: mainnet.id,
      maxRequestsPerSecond: 500,
      transport: loadBalance([
        rateLimit(http(process.env.PONDER_RPC_URL_MAINNET_100RPS), {
          requestsPerSecond: 100,
        }),
        rateLimit(http(process.env.PONDER_RPC_URL_MAINNET_250RPS), {
          requestsPerSecond: 250,
        }),
        webSocket(process.env.PONDER_RPC_URL_MAINNET_WS),
      ]),
    },
    optimism: {
      chainId: optimism.id,
      maxRequestsPerSecond: 500,
      transport: loadBalance([
        rateLimit(http(process.env.PONDER_RPC_URL_OPTIMISM_100RPS), {
          requestsPerSecond: 100,
        }),
        rateLimit(http(process.env.PONDER_RPC_URL_OPTIMISM_250RPS), {
          requestsPerSecond: 250,
        }),
        webSocket(process.env.PONDER_RPC_URL_OPTIMISM_WS),
      ]),
    },
    arbitrum: {
      chainId: arbitrum.id,
      maxRequestsPerSecond: 500,
      transport: loadBalance([
        rateLimit(http(process.env.PONDER_RPC_URL_ARBITRUM_100RPS), {
          requestsPerSecond: 100,
        }),
        rateLimit(http(process.env.PONDER_RPC_URL_ARBITRUM_250RPS), {
          requestsPerSecond: 250,
        }),
        webSocket(process.env.PONDER_RPC_URL_ARBITRUM_WS),
      ]),
    },
    base: {
      chainId: base.id,
      maxRequestsPerSecond: 500,
      transport: loadBalance([
        rateLimit(http(process.env.PONDER_RPC_URL_BASE_100RPS), {
          requestsPerSecond: 100,
        }),
        rateLimit(http(process.env.PONDER_RPC_URL_BASE_250RPS), {
          requestsPerSecond: 250,
        }),
        webSocket(process.env.PONDER_RPC_URL_BASE_WS),
      ]),
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
          interval: (60 * 60 * 12) / 12,
        },
        optimism: {
          startBlock: START_BLOCKS[optimism.id],
          interval: (60 * 60 * 12) / 2,
        },
        arbitrum: {
          // siloLens was only deployed on arbitrum on block 86265292, so there's no need to check before that
          startBlock: 86_265_292,
          interval: (60 * 60 * 12) / 0.2,
        },
        base: {
          startBlock: START_BLOCKS[base.id],
          interval: (60 * 60 * 12) / 2,
        },
      },
    },
  },
});
