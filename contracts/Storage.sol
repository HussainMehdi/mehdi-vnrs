//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import {LibReentrancyGuard} from "./lib/LibReentrancyGuard.sol";
import {LibAdmin} from "./lib/LibAdmin.sol";
import {Types} from "./Types.sol";
import {Admin} from "./Admin.sol";

contract Storage is LibAdmin, LibReentrancyGuard, Types {
    // ============ Mutable Storage ============
    address public acceptedToken;
    address public feePool;
    uint256 public maxAllowedGas = 209004562;
    uint256 public commitGraceBlocks = 20;
    uint256 public activationGraceBlocks = 20;
    uint256 public costPerChar = 2e18;
    uint256 public feeRatio = 0.01e18; // default to 1%
    uint256 public maxExpirationAllowed = 365 days; // default to 1 year
    mapping(bytes32 => uint256) internal pendingCommits;
    mapping(bytes32 => uint256) internal registrationRequests;
    mapping(bytes32 => RegisteredVanityRecord) public registeredVanityRecords;
    mapping(address => mapping(bytes32 => UserActiveVanityRecord))
        public userActiveVanityRecords;
}
