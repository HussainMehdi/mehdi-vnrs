import BigNumber from "bignumber.js";
import { expect } from "chai";
import { ethers } from "hardhat";
import Web3 from "web3";
import { VanityRegister } from "../scripts/modules/VanityRegister";
import { EVM } from "./lib/evm";

const defaultStruct = {
  name: "apple",
  salt: new BigNumber(123),
  user: "0x0000000000000000000000000000000000000000",
  expiration: new BigNumber("3600000000000"),
};

describe("Debug", function () {
  it("should not fail", async function () {
    const net = await ethers.provider.getNetwork();
    const networkChainId = net.chainId;
    const sgn = await ethers.getSigners();
    const address = sgn[0].address.toLowerCase();

    const VNRS = await ethers.getContractFactory("VNRS");
    const _VNRS = await VNRS.deploy(networkChainId);
    await _VNRS.deployed();
    const contractAdrr = _VNRS.address.toLowerCase();

    const vreg = new VanityRegister(networkChainId, contractAdrr);

    const solidityStruct = await vreg.vanityRecordToSolidity({
      ...defaultStruct,
      user: address,
    });
    const ofHash = vreg.getVanityRecordHash({ ...defaultStruct, user: address });
    console.log({ ofHash });
    await _VNRS.commitRegistration(ofHash);
    console.log({ solidityStruct });
    
    const typedSig = await vreg.getSignedVanityStruct(solidityStruct);
    console.log({ typedSig });
    const td = vreg.toSolidityByteVanityRecord(typedSig);
    console.log({ td });
    
    await _VNRS.registerVanityDomain(td);
    
    const evm = new EVM(ethers.provider)
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    await evm.mineBlock();
    
    await _VNRS.activateVanityDomain(new Web3().eth.abi.encodeParameter('bytes32', Web3.utils.fromAscii("apple")));
    
    await _VNRS.commitRegistration(ofHash);
    // await _VNRS.registerVanityDomain(td);
    
    

    // await _VNRS.registerDomain(td)
  });
});
