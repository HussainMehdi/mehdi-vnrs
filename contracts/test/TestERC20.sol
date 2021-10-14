//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Test_Token
 * @notice Mintable ERC-20 token for testing
 */

contract TestERC20 is ERC20("TestERC20", "TestERC20") {
    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }
}
