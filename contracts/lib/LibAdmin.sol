//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {LibStorage} from "./LibStorage.sol";

/**
 * @title LibAdmin
 * @dev EIP-1967 Proxy Admin contract.
 */
contract LibAdmin {
    /**
     * @dev Storage slot with the admin of the contract.
     *  This is the keccak-256 hash of "ei967.proxy.admin" subtracted by 1.
     */
    bytes32 internal constant ADMIN_SLOT =
        0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;

    constructor() {
        LibStorage.store(ADMIN_SLOT, bytes32(uint256(uint160(msg.sender))));
    }

    /**
     * @dev Modifier to check whether the `msg.sender` is the admin.
     *  If it is, it will run the function. Otherwise, it will revert.
     */
    modifier onlyAdmin() {
        require(msg.sender == getAdmin(), "LibAdmin: caller is not admin");
        _;
    }

    /**
     * @return The EIP-1967 proxy admin
     */
    function getAdmin() public view returns (address) {
        return address(uint160(uint256(LibStorage.load(ADMIN_SLOT))));
    }

    /**
     * @dev Set the EIP-1967 proxy admin.
     * @param admin The new admin.
     */
    function setAdmin(address admin) public onlyAdmin returns (bool) {
        LibStorage.store(ADMIN_SLOT, bytes32(uint256(uint160(admin))));
        return true;
    }
}
