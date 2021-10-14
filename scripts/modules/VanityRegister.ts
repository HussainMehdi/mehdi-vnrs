import Web3 from "web3";
import { ethers } from "hardhat";

import {
  addressToBytes32,
  combineHexStrings,
  getEIP712Hash,
  hashString,
  stripHexPrefix,
} from "../lib/utils";
import {
  EIP712_DOMAIN_NAME,
  EIP712_DOMAIN_STRING,
  EIP712_DOMAIN_STRUCT,
  EIP712_DOMAIN_VERSION,
  EIP712_REGISTRATION_SIGNATURE_TYPE_ARR,
  EIP712_REGISTRATION_STRUCT,
  EIP712_REGISTRATION_STRUCT_STRING,
} from "../lib/constants";
import {
  SignedSolidityVanityRecord,
  SolidityVanityRecord,
  VanityRecord,
} from "../lib/types";

export class VanityRegister {
  private web3: Web3;
  private networkId: number;
  public address: string;

  constructor(networkId: number, address: string) {
    this.web3 = new Web3();
    this.networkId = networkId;
    this.address = address;
  }

  public toSolidityByteVanityRecord(
    vanityRecord: SignedSolidityVanityRecord
  ): string {
    const oa = this.web3.eth.abi.encodeParameters(
      EIP712_REGISTRATION_SIGNATURE_TYPE_ARR,
      [
        vanityRecord.name,
        vanityRecord.user,
        vanityRecord.expiration,
        vanityRecord.salt,
      ]
    );
    const signatureDataA = vanityRecord.typedSignature + "0".repeat(60);
    return combineHexStrings(oa, signatureDataA);
  }

  private getDomainData() {
    return {
      name: EIP712_DOMAIN_NAME,
      version: EIP712_DOMAIN_VERSION,
      chainId: this.networkId,
      verifyingContract: this.address,
    };
  }

  public async getSignedVanityStruct(
    vrs: SolidityVanityRecord
  ): Promise<SignedSolidityVanityRecord> {
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

  // ============ Private Helper Functions ============

  public vanityRecordToSolidity(
    vanityRecord: VanityRecord
  ): SolidityVanityRecord {
    return {
      name: this.getVanityRegistrationName(vanityRecord),
      salt: vanityRecord.salt.toFixed(0),
      user: vanityRecord.user,
      expiration: vanityRecord.expiration.toFixed(0),
    } as SolidityVanityRecord;
  }

  private getVanityRegistrationName(vanityRecord: VanityRecord): string {
    return Web3.utils.asciiToHex(vanityRecord.name);
  }

  // ============ Hashing Functions ============

  /**
   * Returns the final signable EIP712 hash for approving an vanityRecord.
   */
  public getVanityRecordHash(vanityRecord: VanityRecord): string {
    const structHash = Web3.utils.soliditySha3(
      { t: "bytes32", v: hashString(EIP712_REGISTRATION_STRUCT_STRING) || "" },
      { t: "bytes32", v: this.getVanityRegistrationName(vanityRecord) },
      { t: "bytes32", v: addressToBytes32(vanityRecord.user) },
      { t: "uint256", v: vanityRecord.expiration.toFixed(0) },
      { t: "uint256", v: vanityRecord.salt.toFixed(0) }
    );
    return structHash ? getEIP712Hash(this.getDomainHash(), structHash) : "";
  }

  /**
   * Returns the EIP712 domain separator hash.
   */
  public getDomainHash(): string {
    return (
      Web3.utils.soliditySha3(
        { t: "bytes32", v: hashString(EIP712_DOMAIN_STRING) || "" },
        { t: "bytes32", v: hashString(EIP712_DOMAIN_NAME) || "" },
        { t: "bytes32", v: hashString(EIP712_DOMAIN_VERSION) || "" },
        { t: "uint256", v: `${this.networkId}` },
        { t: "bytes32", v: addressToBytes32(this.address) }
      ) || ""
    );
  }
}
