import { ethers } from "hardhat";

async function main() {
  const net = await ethers.provider.getNetwork();
  const networkChainId = net.chainId;
  const VNRS = await ethers.getContractFactory("VNRS");
  const vnrs = await VNRS.deploy(networkChainId);

  await vnrs.deployed();

  console.log("VNRS deployed to:", vnrs.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
