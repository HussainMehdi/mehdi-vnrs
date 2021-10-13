import Web3 from "web3";
import { ethers } from "hardhat";

import { combineHexStrings, stripHexPrefix } from "../lib/utils";
import {
  EIP712_DOMAIN_NAME,
  EIP712_DOMAIN_STRUCT,
  EIP712_DOMAIN_VERSION,
  EIP712_REGISTRATION_STRUCT,
} from "../lib/constants";

export class VanityRegister {
  private web3: Web3;
  private networkId: number;
  public address: string;

  constructor(networkId: number, address: string) {
    this.web3 = new Web3();
    this.networkId = networkId;
    this.address = address;
  }

  public toSolidityByteVanity(vr: any): string {
    const vrData = this.web3.eth.abi.encodeParameters(
      EIP712_REGISTRATION_STRUCT.map((arg) => arg.type),
      EIP712_REGISTRATION_STRUCT.map((arg) => vr[arg.name])
    );
    const signatureDataA = vr.typedSignature + "0".repeat(60);
    return combineHexStrings(vrData, signatureDataA);
  }

  private getDomainData() {
    return {
      name: EIP712_DOMAIN_NAME,
      version: EIP712_DOMAIN_VERSION,
      chainId: this.networkId,
      verifyingContract: this.address,
    };
  }

  public async getSignedVanityStruct(vrs: any): Promise<any> {
    const data = {
      types: {
        EIP712Domain: EIP712_DOMAIN_STRUCT,
        VanityRegistry: EIP712_REGISTRATION_STRUCT,
      },
      domain: this.getDomainData(),
      primaryType: "VanityRegistry",
      message: vrs,
    };

    const response = await ethers.provider.send("eth_signTypedData_v4", [
      vrs.user,
      data,
    ]);
    if (response.error) {
      throw new Error(response.error.message);
    }

    return {
      ...vrs,
      typedSignature: `0x${stripHexPrefix(response)}00`,
    };
  }
}
