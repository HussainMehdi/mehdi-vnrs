import BigNumber from "bignumber.js";
import { expect } from "chai";
import { ethers } from "hardhat";
import Web3 from "web3";
import { VanityRecord } from "../scripts/lib/types";
import { VanityRegister } from "../scripts/modules/VanityRegister";
import { networkChainId, signers } from "../scripts/lib/globals";
import { getContractStorage } from "../scripts/lib/contractStorage";

let vnrsAddr: string
let vreg: VanityRegister;
const defaultRecord = {
    name: "ABAG",
    salt: new BigNumber(1212),
    user: "0x0000000000000000000000000000000000000000",
    expiration: new BigNumber("30"),
} as VanityRecord;



describe("Commit-Reveal", function () {
    it("should initialize offchain helpers", async () => {
        vnrsAddr = getContractStorage("VNRS", networkChainId.toString()).address
        vreg = new VanityRegister(networkChainId, vnrsAddr);
    })
    if (process.env.COVERAGE === 'true') {
        it("should setup allowed gas to max", async () => {
            const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);
            await VNRS.setMaxAllowedGas(new BigNumber(99999).shiftedBy(18).toFixed(0));
        }) 
    }
    it("should commit VanityRegistration struct hash successfully", async () => {
        defaultRecord.user = signers[0].address;
        const offchainHash = vreg.getVanityRecordHash(defaultRecord);
        const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);
        const resp = await (await VNRS.commitRegistration(offchainHash)).wait();

        expect(resp.events[0].event).to.be.equal('LogHashCommitted');
        expect(resp.logs[0].data).to.be.equal(offchainHash);
    })
    it("contract revert if hash is invalid", async () => {
        let err = undefined;
        try {
            const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);
            const resp = await (await VNRS.commitRegistration('invalid string')).wait();
        } catch (e) {
            err = e;
        }
        expect(err).to.not.be.undefined;
    })
    it("contract revert if hash is committed twice", async () => {
        let err = '';
        try {
            defaultRecord.user = signers[0].address;
            const offchainHash = vreg.getVanityRecordHash(defaultRecord);
            const VNRS = (await ethers.getContractFactory("VNRS")).attach(vnrsAddr);
            await (await VNRS.commitRegistration(offchainHash)).wait();
            await (await VNRS.commitRegistration(offchainHash)).wait();

        } catch (e) {
            err = (e as any).toString();
        }
        expect(err).to.contains('registration hash already committed');
    })
})