export const EIP712_DOMAIN_STRUCT = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

export const EIP712_DOMAIN_NAME = "VanityRegistry";
export const EIP712_DOMAIN_STRING: string =
  "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";

export const EIP712_DOMAIN_VERSION = "1.0";

export const EIP712_REGISTRATION_STRUCT = [
  { type: "bytes32", name: "name" },
  { type: "address", name: "user" },
  { type: "uint256", name: "expiration" },
  { type: "uint256", name: "salt" },
];

export const EIP712_REGISTRATION_SIGNATURE_TYPE_ARR = [
  "bytes32",
  "address",
  "uint256",
  "uint256",
];

export const EIP712_REGISTRATION_STRUCT_STRING =
  "VanityRegistry(" +
  "bytes32 name," +
  "address user," +
  "uint256 expiration," +
  "uint256 salt" +
  ")";
