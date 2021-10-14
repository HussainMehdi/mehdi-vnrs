import BigNumber from "bignumber.js";
import { expect } from "chai";
import { ethers } from "hardhat";
import Web3 from "web3";
import { VanityRecord } from "../scripts/lib/types";
import { VanityRegister } from "../scripts/modules/VanityRegister";
import { EVM } from "./lib/evm";
import { main } from '../scripts/deploy'

describe("Deployment", function () {
    it("should deploy and save contracts successully", async () => {
        const net = await ethers.provider.getNetwork();
        await main();
    })
})