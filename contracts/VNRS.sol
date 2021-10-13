//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "hardhat/console.sol";

contract VNRS {
    bytes32 public _EIP712_DOMAIN_HASH_;

    struct Signature {
        bytes32 r;
        bytes32 s;
        bytes2 v;
    }

    struct RegistrationData {
        VanityRecord vr;
        Signature signature;
    }

    struct VanityRecord {
        bytes32 name;
        address user;
        uint256 expiration;
        uint256 salt;
    }

    // ============ Constants ============

    // EI91 header for EIP712 prefix
    bytes2 private constant EI91_HEADER = 0x1901;

    // EIP712 Domain Name value
    string private constant EIP712_DOMAIN_NAME = "VanityRegistry";

    // EIP712 Domain Version value
    string private constant EIP712_DOMAIN_VERSION = "1.0";

    // Hash of the EIP712 Domain Separator Schema
    bytes32 private constant EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH =
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

    // Hash of the EIP712 struct
    bytes32 private constant EIP712_REGISTRATION_STRUCT_SCHEMA_HASH =
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

    constructor(uint256 chainId) {
        _EIP712_DOMAIN_HASH_ = keccak256(
            abi.encode(
                EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH,
                keccak256(bytes(EIP712_DOMAIN_NAME)),
                keccak256(bytes(EIP712_DOMAIN_VERSION)),
                chainId,
                address(this)
            )
        );
    }

    function testSign(bytes calldata data) public view {
        RegistrationData memory registrationData = abi.decode(
            data,
            (RegistrationData)
        );
        _verifySignature(registrationData.vr, registrationData.signature);
    }

    function _verifySignature(
        VanityRecord memory vr,
        Signature memory signature
    ) private view {
        bytes32 vantyRecordHash = _getHash(vr);
        require(
            vr.user ==
                ecrecover(
                    vantyRecordHash,
                    uint8(bytes1(signature.v)),
                    signature.r,
                    signature.s
                ),
            "invalid signature"
        );
    }

    /**
     * @dev Returns the EIP712 hash of an vantyRecord.
     */
    function _getHash(VanityRecord memory vr) private view returns (bytes32) {
        // compute the overall signed struct hash
        bytes32 structHash = keccak256(
            abi.encode(EIP712_REGISTRATION_STRUCT_SCHEMA_HASH, vr)
        );
        // compute eip712 compliant hash
        return
            keccak256(
                abi.encodePacked(EI91_HEADER, _EIP712_DOMAIN_HASH_, structHash)
            );
    }
}
