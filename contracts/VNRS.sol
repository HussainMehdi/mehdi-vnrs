//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Storage} from "./Storage.sol";
import {Constants} from "./Constants.sol";
import {Admin} from "./Admin.sol";
import {Getters} from "./Getters.sol";

import "hardhat/console.sol";

contract VNRS is Storage, Admin, Constants, Getters {
    using SafeMath for uint256;

    // ============ Immutable Storage ============
    // Hash of the EIP712 Domain Separator data
    bytes32 public domainHashEIP712;

    // ============ Modifiers ============
    modifier resonableGas() {
        require(gasleft() < maxAllowedGas, "max allowed gas exceeded");
        _;
    }

    // ============ Constructor ============
    constructor(uint256 chainId, address _acceptedToken) {
        domainHashEIP712 = keccak256(
            abi.encode(
                EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH,
                keccak256(bytes(EIP712_DOMAIN_NAME)),
                keccak256(bytes(EIP712_DOMAIN_VERSION)),
                chainId,
                address(this)
            )
        );
        acceptedToken = _acceptedToken;
    }

    // ============ Public Functions ============
    function getDomainStatus(bytes32 name)
        public
        view
        returns (RegisteredRecordStatus)
    {
        RegisteredVanityRecord memory record = registeredVanityRecords[name];
        return
            record.expiration < block.timestamp
                ? RegisteredRecordStatus.Expired
                : record.status;
    }

    // ============ External Functions ============
    function activateVanityDomain(bytes32 name)
        external
        nonReentrant
        resonableGas
    {
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
        _settleActivation(name, record);
    }

    function registerVanityDomain(bytes calldata data)
        external
        nonReentrant
        resonableGas
    {
        RegistrationData memory rd = abi.decode(data, (RegistrationData));
        bytes32 hash = _verifySignature(rd.vr, rd.signature);
        uint256 rrt = registrationRequests[rd.vr.name];
        require(rd.vr.user == msg.sender, "struct user is not msg.sender");
        require(
            rd.vr.expiration <= maxExpirationAllowed,
            "registration exceeds max allowed expiration time"
        );
        require(
            pendingCommits[hash].add(commitGraceBlocks) > block.number,
            "committed domain request expired"
        );
        require(
            _isDomainExpired(rd.vr.name),
            "already registered or not expired"
        );
        if (
            rrt == 0 ||
            pendingCommits[hash] < rrt ||
            registeredVanityRecords[rd.vr.name].activeTime.add(
                commitGraceBlocks
            ) <
            block.number
        ) {
            registrationRequests[rd.vr.name] = pendingCommits[hash];
            registeredVanityRecords[rd.vr.name] = RegisteredVanityRecord({
                name: rd.vr.name,
                user: rd.vr.user,
                activeTime: block.number,
                expiration: rd.vr.expiration.add(block.timestamp),
                status: RegisteredRecordStatus.Open
            });
            emit LogRegisteredVanityRecord(
                rd.vr.name,
                msg.sender,
                block.number,
                registeredVanityRecords[rd.vr.name].expiration,
                RegisteredRecordStatus.Open
            );
        }
    }

    function commitRegistration(bytes32 hash) public {
        require(
            pendingCommits[hash] == 0,
            "registration hash already committed"
        );
        pendingCommits[hash] = block.number;
        emit LogHashCommitted(msg.sender, hash);
    }

    function claimExpiredDomainAmount(bytes32 name)
        external
        nonReentrant
        resonableGas
    {
        UserActiveVanityRecord memory record = userActiveVanityRecords[
            msg.sender
        ][name];
        require(record.activeTime != 0, "domain is not registered by user");
        require(record.expiration < block.timestamp, "record is not expired");
        SafeERC20.safeTransfer(
            IERC20(acceptedToken),
            msg.sender,
            record.lockedAmount
        );
        userActiveVanityRecords[msg.sender][name] = UserActiveVanityRecord({
            lockedAmount: 0,
            feePaid: 0,
            activeTime: 0,
            expiration: 0
        });
        emit LogUserClaimedExpiredDomain(msg.sender, name, record.lockedAmount);
    }

    function extendDomainTime(bytes calldata data)
        external
        nonReentrant
        resonableGas
    {
        RegistrationData memory rd = abi.decode(data, (RegistrationData));
        _verifySignature(rd.vr, rd.signature);
        RegisteredVanityRecord memory record = registeredVanityRecords[
            rd.vr.name
        ];
        require(
            rd.vr.expiration <= maxExpirationAllowed,
            "registration exceeds max allowed expiration time"
        );
        require(record.user == msg.sender, "extender is not same as registrar");
        require(
            record.status == RegisteredRecordStatus.Active,
            "registration not active or expired"
        );
        registeredVanityRecords[rd.vr.name] = RegisteredVanityRecord({
            name: rd.vr.name,
            user: rd.vr.user,
            activeTime: block.number,
            expiration: rd.vr.expiration.add(
                registeredVanityRecords[rd.vr.name].expiration
            ),
            status: RegisteredRecordStatus.Open
        });
        _settleActivation(rd.vr.name, record);
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

    function _settleActivation(
        bytes32 name,
        RegisteredVanityRecord memory record
    ) private {
        // fee calculation and locking
        uint256 price = _calculateNameRegistrationCost(name);
        uint256 fee = price.mul(feeRatio).div(1e18);
        uint256 amount;
        UserActiveVanityRecord memory useracr = userActiveVanityRecords[
            msg.sender
        ][name];
        if (useracr.activeTime == 0) {
            userActiveVanityRecords[msg.sender][name] = UserActiveVanityRecord({
                lockedAmount: price,
                feePaid: fee,
                activeTime: block.number,
                expiration: record.expiration
            });
            amount = price;
        } else {
            if (price > useracr.lockedAmount) {
                amount = price.sub(useracr.lockedAmount);
            }
            userActiveVanityRecords[msg.sender][name] = UserActiveVanityRecord({
                lockedAmount: price.add(amount),
                feePaid: useracr.feePaid.add(fee),
                activeTime: block.number,
                expiration: record.expiration
            });
        }

        amount = amount.add(fee);
        // deposit amount from user to VNRS
        SafeERC20.safeTransferFrom(
            IERC20(acceptedToken),
            msg.sender,
            address(this),
            amount
        );
        // deposit fee to pool
        if (feePool != address(0)) {
            SafeERC20.safeTransfer(IERC20(acceptedToken), feePool, fee);
        }

        record.status = RegisteredRecordStatus.Active;
        registeredVanityRecords[name] = record;
        registrationRequests[name] = 0;
        emit LogUserActiveVanityRecord(
            msg.sender,
            amount,
            fee,
            block.timestamp,
            userActiveVanityRecords[msg.sender][name].expiration
        );
    }

    function _getVanityNameLength(bytes32 name) private pure returns (uint256) {
        // could be done by binary search to reduce compute, but that will require more memory
        uint256 length = 0;
        for (uint256 i = 0; i < 32; i++) {
            if (name[i] != 0) {
                length++;
            } else {
                break;
            }
        }
        return length;
    }

    function _calculateNameRegistrationCost(bytes32 name)
        private
        view
        returns (uint256)
    {
        uint256 length = _getVanityNameLength(name);
        return costPerChar.mul(length);
    }

    function _isDomainExpired(bytes32 name) private view returns (bool) {
        RegisteredVanityRecord memory record = registeredVanityRecords[name];
        return
            record.status != RegisteredRecordStatus.Active ||
            record.expiration < block.timestamp;
    }
}
