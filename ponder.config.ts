import { createConfig } from "@ponder/core";
import { parseAbiItem } from "abitype";
import { http } from "viem";

import { SiloAbi } from "./abis/SiloAbi";
import { SiloFactoryAbi } from "./abis/SiloFactoryAbi";
import { arbitrum, base, mainnet, optimism } from "viem/chains";

const siloFactoryEvent = parseAbiItem(
  "event NewSiloCreated(address indexed silo, address indexed asset, uint128 version)"
);

const START_BLOCKS = {
  [mainnet.id]: 20515486, // 20_367_992, //, 20515486 - 100_000),
  [optimism.id]: 123_951_616, // 120_480_601, //, 123_951_616 - 100_000),
  [arbitrum.id]: 51_894_508, // 212_235_974, // 51_894_508, //, 242_235_974 - 100_000),
  [base.id]: 18356336, // 16_262_586, //, 18356336 - 100_000),
} as const;

export default createConfig({
  networks: {
    mainnet: {
      chainId: mainnet.id,
      transport: http(process.env.PONDER_RPC_URL_MAINNET),
      maxRequestsPerSecond: 100,
    },
    optimism: {
      chainId: optimism.id,
      transport: http(process.env.PONDER_RPC_URL_OPTIMISM),
      maxRequestsPerSecond: 100,
    },
    arbitrum: {
      chainId: arbitrum.id,
      transport: http(process.env.PONDER_RPC_URL_ARBITRUM),
      maxRequestsPerSecond: 100,
    },
    base: {
      chainId: base.id,
      transport: http(process.env.PONDER_RPC_URL_BASE),
      maxRequestsPerSecond: 100,
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
          startBlock: 20515486,
          interval: 12 / 12,
        },
        optimism: {
          startBlock: 123_951_616,
          interval: 12 / 2,
        },
        arbitrum: {
          startBlock: 242_235_974,
          interval: 12 / 0.2,
        },
        base: {
          startBlock: 18356336,
          interval: 12 / 2,
        },
      },
    },
  },
});
