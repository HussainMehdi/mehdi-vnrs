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
describe("Admin", function () {
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
  it("setAdmin", async () => {
    const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);
    await VNRS.setAdmin(signers[0].address);
    const res = await VNRS.getAdmin();
    expect(res).to.equal(signers[0].address);
  });
  it("setAcceptedToken", async () => {
    const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);
    await VNRS.setAcceptedToken(erc20Addr);
    const res = await VNRS.getAcceptedToken();
    expect(res).to.equal(erc20Addr);
  });
  it("setFeePool", async () => {
    const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);
    await VNRS.setFeePool(erc20Addr);
    const res = await VNRS.getFeePool();
    expect(res).to.equal(erc20Addr);
  });

  it("setMaxAllowedGas", async () => {
    const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);
    await VNRS.setMaxAllowedGas(new BigNumber(50000).toFixed(0));
    const res = await VNRS.getMaxAllowedGas();
    expect(res).to.equal(new BigNumber(50000).toFixed(0));
  });

  it("setCommitGraceBlocks", async () => {
    const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);
    await VNRS.setCommitGraceBlocks(new BigNumber(50000).toFixed(0));
    const res = await VNRS.getCommitGraceBlocks();
    expect(res).to.equal(new BigNumber(50000).toFixed(0));
  });

  it("setActivationGraceBlocks", async () => {
    const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);
    await VNRS.setActivationGraceBlocks(new BigNumber(50000).toFixed(0));
    const res = await VNRS.getActivationGraceBlocks();
    expect(res).to.equal(new BigNumber(50000).toFixed(0));
  });

  it("setCostPerCharacter", async () => {
    const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);
    await VNRS.setCostPerCharacter(new BigNumber(50000).toFixed(0));
    const res = await VNRS.getCostPerCharacter();
    expect(res).to.equal(new BigNumber(50000).toFixed(0));
  });

  it("setFeeRatio", async () => {
    const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);
    await VNRS.setFeeRatio(new BigNumber(50000).toFixed(0));
    const res = await VNRS.getFeePercentage();
    expect(res).to.equal(new BigNumber(50000).toFixed(0));
  });
  it("setMaxExpirationAllowed", async () => {
    const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);
    await VNRS.setMaxExpirationAllowed(new BigNumber(50000).toFixed(0));
    const res = await VNRS.getMaxExpirationAllowed();
    expect(res).to.equal(new BigNumber(50000).toFixed(0));
  });
  it("getVanityDomainOwnership", async () => {
    const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);
    const res = await VNRS.getVanityDomainOwnership(
      new Web3().eth.abi.encodeParameter(
        "bytes32",
        Web3.utils.fromAscii(defaultRecord.name)
      )
    );
    expect(res.toString()).to.contain(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
  });
});
