import { ethers } from "hardhat";
import {
  getContractStorage,
  saveDeployedContracts,
  storeContract,
} from "./lib/contractStorage";
import { initDefaults, networkChainId } from "./lib/globals";

export async function main() {
  initDefaults();

  const TERC = await ethers.getContractFactory("TestERC20");
  const ERC20 = await TERC.deploy();
  await ERC20.deployed();
  console.log("ERC20 deployed to:", ERC20.address);
  storeContract(ERC20, "TERC20", networkChainId.toString());

  const VNRS = await ethers.getContractFactory("VNRS");
  const vnrs = await VNRS.deploy(networkChainId, ERC20.address);
  await vnrs.deployed();
  console.log("VNRS deployed to:", vnrs.address);
  storeContract(vnrs, "VNRS", networkChainId.toString());
  await saveDeployedContracts();
}

if (!process.env.TEST)
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
