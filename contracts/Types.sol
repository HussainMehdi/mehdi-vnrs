//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract Types {
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

    struct UserActiveVanityRecord {
        uint256 lockedAmount;
        uint256 feePaid;
        uint256 activeTime;
        uint256 expiration;
    }

    // ============ Events ============
    event LogRegisteredVanityRecord(bytes32 indexed name, address indexed user, uint256 activeTime, uint256 expiration, RegisteredRecordStatus status);
    event LogUserActiveVanityRecord(address indexed user, uint256 lockedAmount, uint256 feePaid, uint256 activeTime, uint256 expiration);
    event LogHashCommitted(address indexed user, bytes32 hash);
    event LogUserClaimedExpiredDomain(address indexed user, bytes32 name, uint256 unlockedAmount);
}
