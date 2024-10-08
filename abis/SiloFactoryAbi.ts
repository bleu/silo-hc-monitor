export const SiloFactoryAbi = [
  { inputs: [], name: "OnlyRepository", type: "error" },
  { inputs: [], name: "RepositoryAlreadySet", type: "error" },
  { anonymous: false, inputs: [], name: "InitSiloRepository", type: "event" },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "silo", type: "address" },
      {
        indexed: true,
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint128",
        name: "version",
        type: "uint128",
      },
    ],
    name: "NewSiloCreated",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "_siloAsset", type: "address" },
      { internalType: "uint128", name: "_version", type: "uint128" },
      { internalType: "bytes", name: "", type: "bytes" },
    ],
    name: "createSilo",
    outputs: [{ internalType: "address", name: "silo", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_repository", type: "address" }],
    name: "initRepository",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "siloFactoryPing",
    outputs: [{ internalType: "bytes4", name: "", type: "bytes4" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "siloRepository",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
