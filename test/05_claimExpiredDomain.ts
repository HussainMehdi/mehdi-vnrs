import BigNumber from "bignumber.js";
import { expect } from "chai";
import { ethers } from "hardhat";
import Web3 from "web3";
import { VanityRecord } from "../scripts/lib/types";
import { VanityRegister } from "../scripts/modules/VanityRegister";
import { networkChainId, signers } from "../scripts/lib/globals";
import { getContractStorage } from "../scripts/lib/contractStorage";
import { EVM } from "./lib/evm";
let vnrsAddr: string;
let erc20Addr: string;
let vreg: VanityRegister;
let evm: EVM;
const defaultRecord = {
  name: "ABAG",
  salt: new BigNumber(98765),
  user: "0x0000000000000000000000000000000000000000",
  expiration: new BigNumber("50"),
} as VanityRecord;

describe("ClaimExpiredDomain-INIT", function () {
  it("should initialize offchain helpers", async () => {
    if (!evm) {
      evm = new EVM(ethers.provider);
    }
    vnrsAddr = getContractStorage("VNRS", networkChainId.toString()).address;
    erc20Addr = getContractStorage("TERC20", networkChainId.toString()).address;
    vreg = new VanityRegister(networkChainId, vnrsAddr);
  });
});
describe("ClaimExpiredDomain", function () {
  beforeEach(function () {
    if (!evm) {
      evm = new EVM(ethers.provider);
    }
    evm.pushSnapshot();
  });

  afterEach(function () {
    if (!evm) {
      evm = new EVM(ethers.provider);
    }
    evm.popSnapshot();
  });
  it("should get back locked amount of expired VanityRegistration successfully", async () => {
    defaultRecord.user = signers[0].address;
    const offchainHash = vreg.getVanityRecordHash(defaultRecord);
    const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);
    const TERC20 = (await ethers.getContractFactory("TestERC20")).attach(
      erc20Addr
    );
    const commitRegistrationResp = await (
      await VNRS.commitRegistration(offchainHash)
    ).wait();

    const solidityStruct = vreg.vanityRecordToSolidity(defaultRecord);
    const typedSig = await vreg.getSignedVanityStruct(solidityStruct);
    const td = vreg.toSolidityByteVanityRecord(typedSig);
    const registerVanityDomainResp = await (
      await VNRS.registerVanityDomain(td)
    ).wait();

    await evm.mineNBlock(21);

    await TERC20.mint(
      signers[0].address,
      new BigNumber(200).shiftedBy(18).toFixed(0)
    );
    await TERC20.approve(vnrsAddr, new BigNumber(200).shiftedBy(18).toFixed(0));

    const aliceActivationResp = await (
      await VNRS.activateVanityDomain(
        new Web3().eth.abi.encodeParameter(
          "bytes32",
          Web3.utils.fromAscii(defaultRecord.name)
        )
      )
    ).wait();
    await evm.increaseTime(50);
    await evm.mineNBlock(31);
    const aliceClaimResp = await (
      await VNRS.claimExpiredDomainAmount(
        new Web3().eth.abi.encodeParameter(
          "bytes32",
          Web3.utils.fromAscii(defaultRecord.name)
        )
      )
    ).wait();

    const aliceBal = await TERC20.balanceOf(defaultRecord.user);
    expect(commitRegistrationResp.events[0].event).to.be.equal(
      "LogHashCommitted"
    );
    expect(registerVanityDomainResp.events[0].event).to.be.equal(
      "LogRegisteredVanityRecord"
    );
    expect(JSON.stringify(aliceActivationResp.events)).to.be.contains(
      "LogUserActiveVanityRecord"
    );
    expect(JSON.stringify(aliceClaimResp.events)).to.be.contains(
      "LogUserClaimedExpiredDomain"
    );
    expect(new BigNumber(+aliceBal).shiftedBy(-18).toString()).to.be.equal(
      "199.92"
    );
  });

  it("fail to claim not expired domain", async () => {
    let err = "";
    try {
      defaultRecord.user = signers[0].address;
      const offchainHash = vreg.getVanityRecordHash(defaultRecord);
      const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);
      const TERC20 = (await ethers.getContractFactory("TestERC20")).attach(
        erc20Addr
      );
      const commitRegistrationResp = await (
        await VNRS.commitRegistration(offchainHash)
      ).wait();

      const solidityStruct = vreg.vanityRecordToSolidity(defaultRecord);
      const typedSig = await vreg.getSignedVanityStruct(solidityStruct);
      const td = vreg.toSolidityByteVanityRecord(typedSig);
      const registerVanityDomainResp = await (
        await VNRS.registerVanityDomain(td)
      ).wait();

      await evm.mineNBlock(21);

      await TERC20.mint(
        signers[0].address,
        new BigNumber(200).shiftedBy(18).toFixed(0)
      );
      await TERC20.approve(
        vnrsAddr,
        new BigNumber(200).shiftedBy(18).toFixed(0)
      );

      const aliceActivationResp = await (
        await VNRS.activateVanityDomain(
          new Web3().eth.abi.encodeParameter(
            "bytes32",
            Web3.utils.fromAscii(defaultRecord.name)
          )
        )
      ).wait();

      expect(commitRegistrationResp.events[0].event).to.be.equal(
        "LogHashCommitted"
      );
      expect(registerVanityDomainResp.events[0].event).to.be.equal(
        "LogRegisteredVanityRecord"
      );
      expect(JSON.stringify(aliceActivationResp.events)).to.be.contains(
        "LogUserActiveVanityRecord"
      );

      await (
        await VNRS.claimExpiredDomainAmount(
          new Web3().eth.abi.encodeParameter(
            "bytes32",
            Web3.utils.fromAscii(defaultRecord.name)
          )
        )
      ).wait();
    } catch (e: any) {
      err = e.toString();
    }
    expect(err).to.be.contains("record is not expired");
  });

  it("bob should fail to claim alice expired domain", async () => {
    let err = "";
    try {
      defaultRecord.user = signers[0].address;
      const offchainHash = vreg.getVanityRecordHash(defaultRecord);
      const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);
      const TERC20 = (await ethers.getContractFactory("TestERC20")).attach(
        erc20Addr
      );
      const commitRegistrationResp = await (
        await VNRS.commitRegistration(offchainHash)
      ).wait();

      const solidityStruct = vreg.vanityRecordToSolidity(defaultRecord);
      const typedSig = await vreg.getSignedVanityStruct(solidityStruct);
      const td = vreg.toSolidityByteVanityRecord(typedSig);
      const registerVanityDomainResp = await (
        await VNRS.registerVanityDomain(td)
      ).wait();

      await evm.mineNBlock(21);

      await TERC20.mint(
        signers[0].address,
        new BigNumber(200).shiftedBy(18).toFixed(0)
      );
      await TERC20.approve(
        vnrsAddr,
        new BigNumber(200).shiftedBy(18).toFixed(0)
      );

      const aliceActivationResp = await (
        await VNRS.activateVanityDomain(
          new Web3().eth.abi.encodeParameter(
            "bytes32",
            Web3.utils.fromAscii(defaultRecord.name)
          )
        )
      ).wait();

      expect(commitRegistrationResp.events[0].event).to.be.equal(
        "LogHashCommitted"
      );
      expect(registerVanityDomainResp.events[0].event).to.be.equal(
        "LogRegisteredVanityRecord"
      );
      expect(JSON.stringify(aliceActivationResp.events)).to.be.contains(
        "LogUserActiveVanityRecord"
      );

      await evm.increaseTime(50);
      await evm.mineNBlock(31);

      await (
        await VNRS.connect(signers[1]).claimExpiredDomainAmount(
          new Web3().eth.abi.encodeParameter(
            "bytes32",
            Web3.utils.fromAscii(defaultRecord.name)
          )
        )
      ).wait();
    } catch (e: any) {
      err = e.toString();
    }
    expect(err).to.be.contains("domain is not registered by user");
  });
});
