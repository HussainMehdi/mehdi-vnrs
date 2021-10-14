//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract Constants {
    // ============ Constants ============

    // EI91 header for EIP712 prefix
    bytes2 internal constant EI91_HEADER = 0x1901;

    // EIP712 Domain Name value
    string internal constant EIP712_DOMAIN_NAME = "VanityRegistry";

    // EIP712 Domain Version value
    string internal constant EIP712_DOMAIN_VERSION = "1.0";

    // Hash of the EIP712 Domain Separator Schema
    bytes32 internal constant EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH =
        keccak256(
            abi.encodePacked(
                "EIP712Domain(",
                "string name,",
                "string version,",
                "uint256 chainId,",
                "address verifyingContract",
                ")"
            )
        );

    // Hash of the EIP712 VanityRecord struct
    bytes32 internal constant EIP712_REGISTRATION_STRUCT_SCHEMA_HASH =
        keccak256(
            abi.encodePacked(
                "VanityRegistry(",
                "bytes32 name,",
                "address user,",
                "uint256 expiration,",
                "uint256 salt",
                ")"
            )
        );
}
