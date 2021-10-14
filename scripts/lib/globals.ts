import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

let networkChainId = -1;
let address = "0x";
let signers: SignerWithAddress[];

export async function initDefaults() {
  const net = await ethers.provider.getNetwork();
  networkChainId = net.chainId;
  signers = await ethers.getSigners();
  address = signers[0].address;
}

export { networkChainId, address, signers };
