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
