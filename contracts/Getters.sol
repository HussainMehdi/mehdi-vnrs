//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import {Storage} from "./Storage.sol";

contract Getters is Storage {
    /**
     * @return address allowed as ERC20 token
     */
    function getAcceptedToken() external view returns (address) {
        return acceptedToken;
    }

    /**
     * @return address of feePool contract
     */
    function getFeePool() external view returns (address) {
        return feePool;
    }

    /**
     * @return number of gas allowed for front-running transaction
     */
    function getMaxAllowedGas() external view returns (uint256) {
        return maxAllowedGas;
    }

    /**
     * @return number of blocks allowed to register in between after commit
     */
    function getCommitGraceBlocks() external view returns (uint256) {
        return commitGraceBlocks;
    }

    /**
     * @return number of blocks allowed to activate in between after registration
     */
    function getActivationGraceBlocks() external view returns (uint256) {
        return activationGraceBlocks;
    }

    /**
     * @return get fee charged per character on registration
     */
    function getCostePerCharacter() external view returns (uint256) {
        return costPerChar;
    }

    /**
     * @return get fee percentage charged on activation
     */
    function getFeePercentage() external view returns (uint256) {
        return feeRatio;
    }

    /**
     * @return get max expiration allowed per vanity domain registration
     */
    function getMaxExpirationAllowed() external view returns (uint256) {
        return maxExpirationAllowed;
    }

    /**
     * @return get registered domain name ownership
     */
    function getVanityDomainOwnership(bytes32 _domainName)
        external
        view
        returns (RegisteredVanityRecord memory)
    {
        return registeredVanityRecords[_domainName];
    }
}
