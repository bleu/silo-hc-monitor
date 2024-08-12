import { ponder } from "@/generated";
import { SiloLensAbi } from "../abis/SiloLensAbi";
import { arbitrum, base, mainnet, optimism } from "viem/chains";

ponder.on("SiloFactory:NewSiloCreated", async ({ context: ctx, event }) => {
  await ctx.db.silo.upsert({
    id: `${event.args.silo}-${ctx.network.chainId}`,
    create: {
      chainId: ctx.network.chainId,
      asset: event.args.asset,
    },
    update: {
      chainId: ctx.network.chainId,
      asset: event.args.asset,
    },
  });
});

ponder.on("Silo:Borrow", async ({ context: ctx, event }) => {
  await ctx.db.borrow.upsert({
    id: `${event.log.address}-${event.args.asset}-${event.args.user}-${ctx.network.chainId}-${event.block.number}`,
    create: {
      chainId: ctx.network.chainId,
      account: event.args.user,
      amount: event.args.amount,
      silo: event.log.address,
    },
    update: {
      chainId: ctx.network.chainId,
      account: event.args.user,
      amount: event.args.amount,
      silo: event.log.address,
    },
  });

  await ctx.db.position.upsert({
    id: `${event.args.user}-${event.log.address}-${ctx.network.chainId}`,
    create: {
      balance: event.args.amount,
      chainId: ctx.network.chainId,
      account: event.args.user,
      silo: event.log.address,
    },
    update: ({ current }) => ({
      balance: current.balance + event.args.amount,
      chainId: ctx.network.chainId,
      account: event.args.user,
      silo: event.log.address,
    }),
  });
});

ponder.on("Silo:Repay", async ({ context: ctx, event }) => {
  await ctx.db.repay.upsert({
    id: `${event.log.address}-${event.args.asset}-${event.args.user}-${ctx.network.chainId}-${event.block.number}`,
    create: {
      chainId: ctx.network.chainId,
      account: event.args.user,
      amount: event.args.amount,
      silo: event.log.address,
    },
    update: {
      chainId: ctx.network.chainId,
      account: event.args.user,
      amount: event.args.amount,
      silo: event.log.address,
    },
  });

  await ctx.db.position.update({
    id: `${event.args.user}-${event.log.address}-${ctx.network.chainId}`,
    data: ({ current }) => ({
      balance: current.balance - event.args.amount,
      chainId: ctx.network.chainId,
      account: event.args.user,
      silo: event.log.address,
    }),
  });
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
  const allBorrows = await ctx.db.position.findMany({
    where: {
      balance: {
        gt: 0n,
      },
    },
  });

  const calls = allBorrows.items.flatMap((borrow) => [
    {
      ...contract,
      functionName: "getUserLTV",
      args: [borrow.silo, borrow.account],
    },
    {
      ...contract,
      functionName: "getUserLiquidationThreshold",
      args: [borrow.silo, borrow.account],
    },
  ]);

  const data = (await ctx.client.multicall({
    contracts: calls,
    allowFailure: false,
  })) as bigint[];

  for (const [i, borrow] of allBorrows.items.entries()) {
    const [ltv, liquidationThreshold] = [data[i], data[i + 1]];
    if (!ltv || !liquidationThreshold) {
      continue;
    }

    const ltvFloat = Number(ltv) / 10 ** 18;
    const liquidationThresholdFloat = Number(liquidationThreshold) / 10 ** 18;

    const healthFactor = 1 - ltvFloat / liquidationThresholdFloat;

    await ctx.db.accountHealthFactor.create({
      id: `${borrow.account}-${borrow.silo}-${ctx.network.chainId}-${event.block.number}`,
      data: {
        chainId: ctx.network.chainId,
        account: borrow.account,
        healthFactor: healthFactor,
        currentLtv: ltv,
        currentLiquidationThreshold: liquidationThreshold,
        block: event.block.number,
        blockTimestamp: event.block.timestamp,
      },
    });
  }
});
