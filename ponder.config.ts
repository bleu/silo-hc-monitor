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
  [mainnet.id]: 20515486 - 100_000,
  [optimism.id]: 123951616 - 100_000,
  [arbitrum.id]: 242235974 - 100_000,
  [base.id]: 18356336 - 100_000,
} as const;

export default createConfig({
  networks: {
    mainnet: {
      chainId: mainnet.id,
      transport: http(process.env.PONDER_RPC_URL_MAINNET),
    },
    optimism: {
      chainId: optimism.id,
      transport: http(process.env.PONDER_RPC_URL_OPTIMISM),
    },
    arbitrum: {
      chainId: arbitrum.id,
      transport: http(process.env.PONDER_RPC_URL_ARBITRUM),
    },
    base: {
      chainId: base.id,
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
      startBlock: START_BLOCKS[mainnet.id],
      interval: 60 / 12,
      network: {
        mainnet: {
          startBlock: START_BLOCKS[mainnet.id],
          interval: 60 / 12,
        },
        optimism: {
          startBlock: START_BLOCKS[optimism.id],
          interval: 60 / 2,
        },
        arbitrum: {
          startBlock: START_BLOCKS[arbitrum.id],
          interval: 60 / 0.2,
        },
        base: {
          startBlock: START_BLOCKS[base.id],
          interval: 60 / 2,
        },
      },
    },
  },
});
