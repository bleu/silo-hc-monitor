export const SiloLensAbi = [
  {
    inputs: [
      {
        internalType: "contract ISiloRepository",
        name: "_siloRepo",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "DifferentArrayLength", type: "error" },
  { inputs: [], name: "InvalidRepository", type: "error" },
  { inputs: [], name: "UnsupportedLTVType", type: "error" },
  { inputs: [], name: "UserIsZero", type: "error" },
  { inputs: [], name: "ZeroAssets", type: "error" },
  { inputs: [], name: "ZeroAssets", type: "error" },
  {
    inputs: [
      { internalType: "uint256", name: "_assetTotalDeposits", type: "uint256" },
      {
        internalType: "contract IShareToken",
        name: "_shareToken",
        type: "address",
      },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "balanceOfUnderlying",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
    ],
    name: "borrowAPY",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "borrowShare",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_amount", type: "uint256" }],
    name: "calcFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
    ],
    name: "calculateBorrowValue",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
    ],
    name: "calculateCollateralValue",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "collateralBalanceOfUnderlying",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
    ],
    name: "collateralOnlyDeposits",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "debtBalanceOfUnderlying",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
    ],
    name: "depositAPY",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "uint256", name: "_timestamp", type: "uint256" },
    ],
    name: "getBorrowAmount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "uint256", name: "_timestamp", type: "uint256" },
    ],
    name: "getDepositAmount",
    outputs: [
      { internalType: "uint256", name: "totalUserDeposits", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
    ],
    name: "getModel",
    outputs: [
      {
        internalType: "contract IInterestRateModel",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "getUserLTV",
    outputs: [{ internalType: "uint256", name: "userLTV", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "getUserLiquidationThreshold",
    outputs: [
      {
        internalType: "uint256",
        name: "liquidationThreshold",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "getUserMaximumLTV",
    outputs: [{ internalType: "uint256", name: "maximumLTV", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
    ],
    name: "getUtilization",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "hasPosition",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "inDebt",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "isSolvent",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lensPing",
    outputs: [{ internalType: "bytes4", name: "", type: "bytes4" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
    ],
    name: "liquidity",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
    ],
    name: "protocolFees",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "siloRepository",
    outputs: [
      { internalType: "contract ISiloRepository", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
    ],
    name: "totalBorrowAmount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
    ],
    name: "totalBorrowAmountWithInterest",
    outputs: [
      { internalType: "uint256", name: "_totalBorrowAmount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
    ],
    name: "totalBorrowShare",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
    ],
    name: "totalDeposits",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISilo", name: "_silo", type: "address" },
      { internalType: "address", name: "_asset", type: "address" },
    ],
    name: "totalDepositsWithInterest",
    outputs: [
      { internalType: "uint256", name: "_totalDeposits", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
