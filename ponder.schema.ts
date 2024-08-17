import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
  account: p.createTable({
    id: p.string(),
    chainId: p.int(),
  }),
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
    account: p.string(),
    silo: p.string(),
    amount: p.bigint(),
    timestamp: p.bigint(),
  }),
  repay: p.createTable({
    id: p.string(),
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
    balance: p.bigint(),
    lastUpdatedBlock: p.bigint(),
    lastUpdatedBlockTimestamp: p.bigint(),
  }),
  token: p.createTable({
    id: p.string(),
    chainId: p.int(),
    name: p.string(),
    symbol: p.string(),
    decimals: p.int(),
  }),
  accountHealthFactor: p.createTable({
    id: p.string(),
    chainId: p.int(),
    account: p.string(),
    healthFactor: p.float(),
    currentLiquidationThreshold: p.bigint(),
    currentLtv: p.bigint(),
    block: p.bigint(),
    blockTimestamp: p.bigint(),
  }),
  chatSubscription: p.createTable({
    id: p.string(),
    chatId: p.int(),
    silo: p.string(),
    account: p.string(),
    language: p.string(),
    chatTitle: p.string(),
    chainId: p.int(),
    creator: p.string(),
    notificationThreshold: p.float(),
    paused: p.boolean(),
  }),
}));
