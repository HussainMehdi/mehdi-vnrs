import BigNumber from "bignumber.js";
// ============ Types ============
export type address = string;
export type name = string;
export type TypedSignature = string;
export type BigNumberable = BigNumber | number | string;

export interface VanityRecord {
  user: address;
  name: name;
  expiration: BigNumber;
  salt: BigNumber;
}
export interface SolidityVanityRecord {
  user: string;
  name: string;
  expiration: string;
  salt: string;
}
export interface SignedSolidityVanityRecord {
  user: string;
  name: string;
  expiration: string;
  salt: string;
  typedSignature: string;
}
