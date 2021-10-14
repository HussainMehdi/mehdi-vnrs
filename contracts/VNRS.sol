//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "hardhat/console.sol";

contract VNRS {
    using SafeMath for uint256;

    // ============ Enums ============
    enum RegisteredRecordStatus {
        Open,
        Active,
        Expired
    }

    // ============ Structs ============
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

    struct RegisteredVanityRecord {
        bytes32 name;
        address user;
        uint256 activeTime;
        uint256 expiration;
        RegisteredRecordStatus status;
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

    // Hash of the EIP712 VanityRecord struct
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

    // ============ Immutable Storage ============

    // Hash of the EIP712 Domain Separator data
    bytes32 public domainHashEIP712;

    // ============ Mutable Storage ============

    uint256 public maxAllowedGas = 209004562;
    uint256 public commitGraceBlocks = 20;
    uint256 public activationGraceBlocks = 20;
    mapping(bytes32 => uint256) public pendingCommits;
    mapping(bytes32 => uint256) private registrationRequests;
    mapping(bytes32 => RegisteredVanityRecord) public registeredVanityRecords;

    // ============ Modifiers ============
    modifier resonableGas() {
        require(gasleft() < maxAllowedGas, "max allowed gas exceeded");
        _;
    }

    // ============ Constructor ============

    constructor(uint256 chainId) {
        domainHashEIP712 = keccak256(
            abi.encode(
                EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH,
                keccak256(bytes(EIP712_DOMAIN_NAME)),
                keccak256(bytes(EIP712_DOMAIN_VERSION)),
                chainId,
                address(this)
            )
        );
    }

    // ============ External Functions ============

    function activateVanityDomain(bytes32 name) external {
        RegisteredVanityRecord memory record = registeredVanityRecords[name];
        require(
            record.user == msg.sender,
            "activater is not same as registrar"
        );
        require(
            record.status == RegisteredRecordStatus.Open,
            "record is not open"
        );
        require(
            record.activeTime.add(activationGraceBlocks) < block.number,
            "not ready for registration"
        );
        // fee calculation and locking here

        record.status = RegisteredRecordStatus.Active;
        registeredVanityRecords[name] = record;
        registrationRequests[name] = 0;
    }

    function registerVanityDomain(bytes calldata data) external {
        RegistrationData memory rd = abi.decode(data, (RegistrationData));
        bytes32 hash = _verifySignature(rd.vr, rd.signature);
        uint256 rrt = registrationRequests[rd.vr.name];
        require(
            pendingCommits[hash].add(commitGraceBlocks) > block.number,
            "committed domain request expired"
        );
        require(
            _isDomainExpired(rd.vr.name),
            "already registered or not expired"
        );
        if (rrt == 0 || pendingCommits[hash] < rrt) {
            registrationRequests[rd.vr.name] = pendingCommits[hash];
            registeredVanityRecords[rd.vr.name] = RegisteredVanityRecord({
                name: rd.vr.name,
                user: rd.vr.user,
                activeTime: block.number,
                expiration: rd.vr.expiration.add(block.timestamp),
                status: RegisteredRecordStatus.Open
            });
        }
    }

    function commitRegistration(bytes32 hash) public {
        pendingCommits[hash] = block.number;
    }

    // ============ Helper Functions ============

    function _verifySignature(
        VanityRecord memory vr,
        Signature memory signature
    ) private view returns (bytes32) {
        bytes32 vrHash = _getHash(vr);
        require(
            vr.user ==
                ecrecover(
                    vrHash,
                    uint8(bytes1(signature.v)),
                    signature.r,
                    signature.s
                ),
            "VanityRecord has an invalid signature"
        );
        return vrHash;
    }

    /**
     * @dev Returns the EIP712 hash of a vanityRecord.
     */
    function _getHash(VanityRecord memory vr) private view returns (bytes32) {
        // compute the overall signed struct hash
        bytes32 structHash = keccak256(
            abi.encode(EIP712_REGISTRATION_STRUCT_SCHEMA_HASH, vr)
        );
        // compute eip712 compliant hash
        return
            keccak256(
                abi.encodePacked(EI91_HEADER, domainHashEIP712, structHash)
            );
    }

    function _getVanityNameLength(bytes32 name) private pure returns (uint256) {
        // could be done by binary search to reduce compute, but that will require more memory
        uint256 length = 0;
        for (uint256 i = 0; i < 32; i++) {
            if (name[i] != 0) {
                length = i;
            } else {
                break;
            }
        }
        return length;
    }

    function _isDomainExpired(bytes32 name) private view returns (bool) {
        RegisteredVanityRecord memory record = registeredVanityRecords[name];
        return record.status != RegisteredRecordStatus.Active
        || record.expiration < block.timestamp;
    }
}
