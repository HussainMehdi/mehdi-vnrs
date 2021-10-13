import BigNumber from "bignumber.js";
import { expect } from "chai";
import { ethers } from "hardhat";
import Web3 from "web3";
import { VanityRegister } from "../scripts/modules/VanityRegister";

describe("Debug", function () {
  it("should not fail", async function () {
    const net = await ethers.provider.getNetwork();
    const networkChainId = net.chainId;
    const sgn = await ethers.getSigners();
    const address = sgn[0].address;

    const VNRS = await ethers.getContractFactory("VNRS");
    const _VNRS = await VNRS.deploy(networkChainId);
    await _VNRS.deployed();
    const contractAdrr = _VNRS.address;

    const vreg = new VanityRegister(networkChainId, contractAdrr);

    const so = await vreg.getSignedVanityStruct({
      name: new Web3().utils.asciiToHex("0"),
      user: address,
      expiration: "1",
      salt: "0",
    });
    const td = vreg.toSolidityByteVanity(so);

    await _VNRS.testSign(td);
  });
});
