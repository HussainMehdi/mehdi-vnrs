//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/**
 * @title LibReentrancyGuard
 * @dev Updated LibReentrancyGuard library designed to be used with Proxy Contracts.
 */
contract LibReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = uint256(int256(-1));

    uint256 private _STATUS_;

    constructor () {
        _STATUS_ = NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_STATUS_ != ENTERED, "ReentrancyGuard: reentrant call");
        _STATUS_ = ENTERED;
        _;
        _STATUS_ = NOT_ENTERED;
    }
}

