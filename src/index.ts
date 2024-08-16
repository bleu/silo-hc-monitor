import { ponder } from "@/generated";
import { arbitrum, base, mainnet, optimism } from "viem/chains";
import { SiloLensAbi } from "../abis/SiloLensAbi";
import { SiloAbi } from "../abis/SiloAbi";
import { erc20Abi } from "abitype/abis";

ponder.on("SiloFactory:NewSiloCreated", async ({ context: ctx, event }) => {
  const assetSymbol = await ctx.client.readContract({
    abi: erc20Abi,
    address: event.args.asset,
    functionName: "symbol",
  });

  await ctx.db.silo.upsert({
    id: `${event.args.silo}-${ctx.network.chainId}`,
    create: {
      chainId: ctx.network.chainId,
      asset: event.args.asset,
      assetSymbol: assetSymbol,
    },
    update: {
      chainId: ctx.network.chainId,
      asset: event.args.asset,
      assetSymbol: assetSymbol,
    },
  });
});

ponder.on("Silo:Borrow", async ({ context: ctx, event }) => {
  await Promise.all([
    ctx.db.silo.upsert({
      id: `${event.log.address}-${ctx.network.chainId}`,
      create: {
        chainId: ctx.network.chainId,
        asset: event.args.asset,
      },
      update: {
        chainId: ctx.network.chainId,
        asset: event.args.asset,
      },
    }),

    ctx.db.borrow.upsert({
      id: `${event.log.address}-${event.args.asset}-${event.args.user}-${ctx.network.chainId}-${event.block.number}`,
      create: {
        chainId: ctx.network.chainId,
        account: event.args.user,
        amount: event.args.amount,
        silo: event.log.address,
        timestamp: event.block.timestamp,
      },
      update: {
        chainId: ctx.network.chainId,
        account: event.args.user,
        amount: event.args.amount,
        silo: event.log.address,
      },
    }),

    ctx.db.position.upsert({
      id: `${event.log.address}-${event.args.asset}-${event.args.user}-${ctx.network.chainId}`,
      create: {
        balance: event.args.amount,
        chainId: ctx.network.chainId,
        account: event.args.user,
        silo: event.log.address,
        lastUpdatedBlockTimestamp: event.block.timestamp,
        lastUpdatedBlock: event.block.number,
      },
      update: ({ current }) => ({
        balance: current.balance + event.args.amount,
        chainId: ctx.network.chainId,
        account: event.args.user,
        silo: event.log.address,
      }),
    }),
  ]);
});

ponder.on("Silo:Repay", async ({ context: ctx, event }) => {
  await Promise.all([
    ctx.db.silo.upsert({
      id: `${event.log.address}-${ctx.network.chainId}`,
      create: {
        chainId: ctx.network.chainId,
        asset: event.args.asset,
      },
      update: {
        chainId: ctx.network.chainId,
        asset: event.args.asset,
      },
    }),

    ctx.db.repay.upsert({
      id: `${event.log.address}-${event.args.asset}-${event.args.user}-${ctx.network.chainId}-${event.block.number}`,
      create: {
        chainId: ctx.network.chainId,
        account: event.args.user,
        amount: event.args.amount,
        silo: event.log.address,
        timestamp: event.block.timestamp,
      },
      update: {
        chainId: ctx.network.chainId,
        account: event.args.user,
        amount: event.args.amount,
        silo: event.log.address,
      },
    }),

    ctx.db.position.upsert({
      id: `${event.log.address}-${event.args.asset}-${event.args.user}-${ctx.network.chainId}`,
      create: {
        balance: event.args.amount,
        chainId: ctx.network.chainId,
        account: event.args.user,
        silo: event.log.address,
        lastUpdatedBlock: event.block.number,
        lastUpdatedBlockTimestamp: event.block.timestamp,
      },
      update: ({ current }) => ({
        balance: current.balance - event.args.amount,
        chainId: ctx.network.chainId,
        account: event.args.user,
        silo: event.log.address,
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

ponder.on("AccountHealthUpdate:block", async ({ context: ctx, event }) => {
  if (!siloLensChainIdMapping[ctx.network.chainId]) {
    throw new Error(
      `No SiloLens contract address for chain ${ctx.network.chainId}`
    );
  }

  const contract = {
    address: siloLensChainIdMapping[ctx.network.chainId],
    abi: SiloLensAbi,
  } as const;

  const allChainPositions = await ctx.db.position.findMany({
    where: {
      chainId: ctx.network.chainId,
    },
  });

  if (!allChainPositions.items.length) return;

  const calls = allChainPositions.items.flatMap((position) => [
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

  const data = (await ctx.client.multicall({
    contracts: calls,
    allowFailure: false,
  })) as bigint[];

  for (const [i, position] of allChainPositions.items.entries()) {
    const [ltv, liquidationThreshold] = [data[i], data[i + 1]];
    if (!ltv || !liquidationThreshold) {
      continue;
    }

    const ltvFloat = Number(ltv) / 10 ** 18;
    const liquidationThresholdFloat = Number(liquidationThreshold) / 10 ** 18;

    const healthFactor = 1 - ltvFloat / liquidationThresholdFloat;

    await ctx.db.accountHealthFactor.upsert({
      id: `${position.silo}-${position.account}-${ctx.network.chainId}-${event.block.number}`,
      create: {
        chainId: ctx.network.chainId,
        account: position.account,
        healthFactor: healthFactor,
        currentLtv: ltv,
        currentLiquidationThreshold: liquidationThreshold,
        block: event.block.number,
        blockTimestamp: event.block.timestamp,
      },
      update: {
        chainId: ctx.network.chainId,
        account: position.account,
        healthFactor: healthFactor,
        currentLtv: ltv,
        currentLiquidationThreshold: liquidationThreshold,
        block: event.block.number,
        blockTimestamp: event.block.timestamp,
      },
    });
  }
});
