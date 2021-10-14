//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/**
 * @title Storage
 * @dev Storage library for reading/writing storage at a low level.
 */
library LibStorage {
    /**
     * @dev Performs an SLOAD and returns the data in the slot.
     */
    function load(bytes32 slot) internal view returns (bytes32) {
        bytes32 result;
        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            result := sload(slot)
        }
        return result;
    }

    /**
     * @dev Performs an SSTORE to save the value to the slot.
     */
    function store(bytes32 slot, bytes32 value) internal {
        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            sstore(slot, value)
        }
    }
}
