import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
  account: p.createTable({
    id: p.string(),
    chainId: p.int(),
  }),
  silo: p.createTable({
    id: p.string(),
    chainId: p.int(),
    asset: p.string(),
  }),
  borrow: p.createTable({
    id: p.string(),
    chainId: p.int(),
    account: p.string(),
    silo: p.string(),
    amount: p.bigint(),
  }),
  repay: p.createTable({
    id: p.string(),
    chainId: p.int(),
    account: p.string(),
    silo: p.string(),
    amount: p.bigint(),
  }),
  position: p.createTable({
    id: p.string(),
    chainId: p.int(),
    account: p.string(),
    silo: p.string(),
    balance: p.bigint(),
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
}));
