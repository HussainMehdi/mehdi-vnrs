import BigNumber from "bignumber.js";
import Web3 from "web3";

import { address, BigNumberable } from "./types";

export function combineHexStrings(...args: string[]): string {
  return `0x${args.map(stripHexPrefix).join("")}`;
}
export function stripHexPrefix(input: string) {
  if (input.startsWith("0x")) {
    return input.slice(2);
  }
  return input;
}

export function hashString(input: string) {
  return Web3.utils.soliditySha3({ t: "string", v: input });
}
export function addressToBytes32(input: address): string {
  return `0x000000000000000000000000${stripHexPrefix(input)}`;
}

/**
 * Returns a signable EIP712 Hash of a struct, given the domain and struct hashes.
 */
export function getEIP712Hash(domainHash: string, structHash: string): string {
  return (
    Web3.utils.soliditySha3(
      { t: "bytes2", v: "0x1901" },
      { t: "bytes32", v: domainHash },
      { t: "bytes32", v: structHash }
    ) || ""
  );
}
