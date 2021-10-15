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
let vreg: VanityRegister;
let evm: EVM;
const defaultRecord = {
  name: "ABAG",
  salt: new BigNumber(98765),
  user: "0x0000000000000000000000000000000000000000",
  expiration: new BigNumber("30"),
} as VanityRecord;

describe("RegisterVanityDomain-INIT", function () {
  it("should initialize offchain helpers", async () => {
    if (!evm) {
      evm = new EVM(ethers.provider);
    }
    vnrsAddr = getContractStorage("VNRS", networkChainId.toString()).address;
    vreg = new VanityRegister(networkChainId, vnrsAddr);
  });
});
describe("RegisterVanityDomain", function () {
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
  it("should register committed VanityRegistration struct hash successfully", async () => {
    defaultRecord.user = signers[0].address;
    const offchainHash = vreg.getVanityRecordHash(defaultRecord);
    const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);
    const commitRegistrationResp = await (
      await VNRS.commitRegistration(offchainHash)
    ).wait();

    const solidityStruct = vreg.vanityRecordToSolidity(defaultRecord);
    const typedSig = await vreg.getSignedVanityStruct(solidityStruct);
    const td = vreg.toSolidityByteVanityRecord(typedSig);
    const registerVanityDomainResp = await (
      await VNRS.registerVanityDomain(td)
    ).wait();

    expect(commitRegistrationResp.events[0].event).to.be.equal(
      "LogHashCommitted"
    );
    expect(registerVanityDomainResp.events[0].event).to.be.equal(
      "LogRegisteredVanityRecord"
    );
  });

  it("only first one to commit will be able to register", async () => {
    const alice = signers[0].address;
    const bob = signers[1].address;
    const bobSigner = signers[1];
    defaultRecord.user = alice;
    const offchainHash = vreg.getVanityRecordHash(defaultRecord);
    const offchainHashBob = vreg.getVanityRecordHash({
      ...defaultRecord,
      user: bob,
    });
    const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);

    await (await VNRS.commitRegistration(offchainHash)).wait();
    await (await VNRS.commitRegistration(offchainHashBob)).wait();

    // for alice
    const solidityStruct = vreg.vanityRecordToSolidity(defaultRecord);
    const typedSig = await vreg.getSignedVanityStruct(solidityStruct);
    const td = vreg.toSolidityByteVanityRecord(typedSig);
    const registerVanityDomainResp = await (
      await VNRS.registerVanityDomain(td)
    ).wait();

    // for bob
    const bobSolidityStruct = vreg.vanityRecordToSolidity({
      ...defaultRecord,
      user: bob,
    });
    const bobTypedSig = await vreg.getSignedVanityStruct(bobSolidityStruct);
    const bobTD = vreg.toSolidityByteVanityRecord(bobTypedSig);
    const bobRegisterVanityDomainResp = await (
      await VNRS.connect(bobSigner).registerVanityDomain(bobTD)
    ).wait();

    expect(registerVanityDomainResp.events[0].event).to.be.equal(
      "LogRegisteredVanityRecord"
    );
    // no event emit for bob as alice already registered and was having hash time earlier
    expect(bobRegisterVanityDomainResp.events.length).to.be.equal(0);
  });

  it("only first one to commit will be able to register even if bob registers first", async () => {
    const alice = signers[0].address;
    const bob = signers[1].address;
    const bobSigner = signers[1];

    defaultRecord.user = alice;
    const offchainHash = vreg.getVanityRecordHash(defaultRecord);
    const offchainHashBob = vreg.getVanityRecordHash({
      ...defaultRecord,
      user: bob,
    });
    const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);

    await (await VNRS.commitRegistration(offchainHash)).wait();
    await (await VNRS.commitRegistration(offchainHashBob)).wait();

    // for bob
    const bobSolidityStruct = vreg.vanityRecordToSolidity({
      ...defaultRecord,
      user: bob,
    });
    const bobTypedSig = await vreg.getSignedVanityStruct(bobSolidityStruct);
    const bobTD = vreg.toSolidityByteVanityRecord(bobTypedSig);
    const bobRegisterVanityDomainResp = await (
      await VNRS.connect(bobSigner).registerVanityDomain(bobTD)
    ).wait();

    // for alice
    const solidityStruct = vreg.vanityRecordToSolidity(defaultRecord);
    const typedSig = await vreg.getSignedVanityStruct(solidityStruct);
    const td = vreg.toSolidityByteVanityRecord(typedSig);
    const registerVanityDomainResp = await (
      await VNRS.registerVanityDomain(td)
    ).wait();

    expect(bobRegisterVanityDomainResp.events[0].event).to.be.equal(
      "LogRegisteredVanityRecord"
    );
    // this time event will get triggered for both as most earlier commit is alice
    expect(registerVanityDomainResp.events[0].event).to.be.equal(
      "LogRegisteredVanityRecord"
    );
  });

  it("bob can only register same name again if alice registration grace time is expired", async () => {
    const alice = signers[0].address;
    const bob = signers[1].address;
    const bobSigner = signers[1];

    defaultRecord.user = alice;
    const offchainHash = vreg.getVanityRecordHash(defaultRecord);
    let offchainHashBob = vreg.getVanityRecordHash({
      ...defaultRecord,
      user: bob,
    });
    const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);

    await (await VNRS.commitRegistration(offchainHash)).wait();
    await (await VNRS.commitRegistration(offchainHashBob)).wait();

    // for bob
    let bobSolidityStruct = vreg.vanityRecordToSolidity({
      ...defaultRecord,
      user: bob,
    });
    let bobTypedSig = await vreg.getSignedVanityStruct(bobSolidityStruct);
    let bobTD = vreg.toSolidityByteVanityRecord(bobTypedSig);
    let bobRegisterVanityDomainResp = await (
      await VNRS.connect(bobSigner).registerVanityDomain(bobTD)
    ).wait();

    // for alice
    const solidityStruct = vreg.vanityRecordToSolidity(defaultRecord);
    const typedSig = await vreg.getSignedVanityStruct(solidityStruct);
    const td = vreg.toSolidityByteVanityRecord(typedSig);
    const registerVanityDomainResp = await (
      await VNRS.registerVanityDomain(td)
    ).wait();

    expect(bobRegisterVanityDomainResp.events[0].event).to.be.equal(
      "LogRegisteredVanityRecord"
    );
    // this time event will get triggered for both as most earlier commit is alice
    expect(registerVanityDomainResp.events[0].event).to.be.equal(
      "LogRegisteredVanityRecord"
    );

    await evm.mineNBlock(21);
    offchainHashBob = vreg.getVanityRecordHash({
      ...defaultRecord,
      user: bob,
      salt: new BigNumber(3232),
    });
    await (await VNRS.commitRegistration(offchainHashBob)).wait();
    // for bob again
    bobSolidityStruct = vreg.vanityRecordToSolidity({
      ...defaultRecord,
      user: bob,
      salt: new BigNumber(3232),
    });
    bobTypedSig = await vreg.getSignedVanityStruct(bobSolidityStruct);
    bobTD = vreg.toSolidityByteVanityRecord(bobTypedSig);
    bobRegisterVanityDomainResp = await (
      await VNRS.connect(bobSigner).registerVanityDomain(bobTD)
    ).wait();
    expect(bobRegisterVanityDomainResp.events[0].event).to.be.equal(
      "LogRegisteredVanityRecord"
    );
  });

  it("alice cannot register using bob commit hash", async () => {
    let err = "";
    try {
      const alice = signers[0].address;
      const bob = signers[1].address;
      const bobSigner = signers[1];

      defaultRecord.user = alice;
      const offchainHashBob = vreg.getVanityRecordHash({
        ...defaultRecord,
        user: bob,
      });
      const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);

      await (await VNRS.commitRegistration(offchainHashBob)).wait();

      // for bob
      const bobSolidityStruct = vreg.vanityRecordToSolidity({
        ...defaultRecord,
        user: bob,
      });
      const bobTypedSig = await vreg.getSignedVanityStruct(bobSolidityStruct);
      const bobTD = vreg.toSolidityByteVanityRecord(bobTypedSig);
      const bobRegisterVanityDomainResp = await (
        await VNRS.connect(bobSigner).registerVanityDomain(bobTD)
      ).wait();

      expect(bobRegisterVanityDomainResp.events[0].event).to.be.equal(
        "LogRegisteredVanityRecord"
      );
      //alice is registering  with bob's hash
      await (await VNRS.registerVanityDomain(bobTD)).wait();
    } catch (e) {
      err = (e as any).toString();
    }
    expect(err).to.be.contains("struct user is not msg.sender");
  });

  it("fails if registered after commit grace period", async () => {
    let err = "";
    const alice = signers[0].address;
    try {
      defaultRecord.user = alice;
      const offchainHash = vreg.getVanityRecordHash(defaultRecord);
      const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);

      await (await VNRS.commitRegistration(offchainHash)).wait();

      // for alice
      const solidityStruct = vreg.vanityRecordToSolidity(defaultRecord);
      const typedSig = await vreg.getSignedVanityStruct(solidityStruct);
      const td = vreg.toSolidityByteVanityRecord(typedSig);
      await evm.mineNBlock(21);
      await (await VNRS.registerVanityDomain(td)).wait();
    } catch (e) {
      err = (e as any).toString();
    }
    expect(err).to.be.contains("committed domain request expired");
  });

  it("should fail if non-reasonable gas is provided", async () => {
    let err = "";
    try {
      defaultRecord.user = signers[0].address;
      const offchainHash = vreg.getVanityRecordHash(defaultRecord);
      const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);
      const commitRegistrationResp = await (
        await VNRS.commitRegistration(offchainHash)
      ).wait();

      const solidityStruct = vreg.vanityRecordToSolidity(defaultRecord);
      const typedSig = await vreg.getSignedVanityStruct(solidityStruct);
      const td = vreg.toSolidityByteVanityRecord(typedSig);
      expect(commitRegistrationResp.events[0].event).to.be.equal(
        "LogHashCommitted"
      );

      await VNRS.setMaxAllowedGas("200");
      await (
        await VNRS.registerVanityDomain(td, {
          gasPrice: 99999462524493,
          gasLimit: 30000000,
        })
      ).wait();
    } catch (e: any) {
      err = e;
    }
    expect(err.toString()).to.be.contains("max allowed gas exceeded");
  });
});
