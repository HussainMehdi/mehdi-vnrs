//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import {LibAdmin} from "./lib/LibAdmin.sol";
import {LibReentrancyGuard} from "./lib/LibReentrancyGuard.sol";
import {Storage} from "./Storage.sol";

contract Admin is Storage {
    // ============ Events ============
    event SetAcceptedToken(address token);
    event SetFeePool(address _feePool);
    event SetMaxAllowedGas(uint256 gas);
    event SetCommitGraceBlocks(uint256 blocks);
    event SetActivationGraceBlocks(uint256 blocks);
    event SetCostPerCharacter(uint256 cost);
    event SetFeeRatio(uint256 _feeRatio);
    event SetMaxExpirationAllowed(uint256 time);

    // ============ Functions ============
    /**
     * @notice Sets new address for payment token.
     * @dev Will be only called by admin. Emits the SetAcceptedToken event.
     *
     * @param  token  The token address to lock and deduct fee from.
     */
    function setAcceptedToken(address token) external onlyAdmin nonReentrant {
        acceptedToken = token;
        emit SetAcceptedToken(token);
    }

    /**
     * @notice Sets new address for FeePool.
     * @dev Will be only called by admin. Emits the SetFeePool event.
     *
     * @param  _feePool  The address where fee gets deposited.
     */
    function setFeePool(address _feePool) external onlyAdmin nonReentrant {
        feePool = _feePool;
        emit SetFeePool(_feePool);
    }

    /**
     * @notice Sets max allowed gas for front-running operations.
     * @dev Will be only called by admin. Emits the SetMaxAllowedGas event.
     *
     * @param  gas  Max gas allowed uint256.
     */
    function setMaxAllowedGas(uint256 gas) external onlyAdmin nonReentrant {
        maxAllowedGas = gas;
        emit SetMaxAllowedGas(gas);
    }

    /**
     * @notice Sets grace block period allowed to register after hash submission,
     *   user have to register vanity domain under grace block period.
     * @dev Will be only called by admin. Emits the SetCommitGraceBlocks event.
     *
     * @param  blocks  number of blocks.
     */
    function setCommitGraceBlocks(uint256 blocks)
        external
        onlyAdmin
        nonReentrant
    {
        commitGraceBlocks = blocks;
        emit SetCommitGraceBlocks(blocks);
    }

    /**
     * @notice Sets grace block period allowed to activate, user have to
     *         activate vanity domain under grace block period.
     * @dev Will be only called by admin. Emits the SetActivationGraceBlocks event.
     *
     * @param  blocks  number of blocks.
     */
    function setActivationGraceBlocks(uint256 blocks)
        external
        onlyAdmin
        nonReentrant
    {
        activationGraceBlocks = blocks;
        emit SetActivationGraceBlocks(blocks);
    }

    /**
     * @notice Sets cost to charge per character for vanity domain registration.
     * @dev Will be only called by admin. Emits the SetCostPerCharacter event.
     *
     * @param  cost  cost in 1e18.
     */
    function setCostPerCharacter(uint256 cost) external onlyAdmin nonReentrant {
        costPerChar = cost;
        emit SetCostPerCharacter(cost);
    }

    /**
     * @notice Percentage of fee to charge on domain registration.
     * @dev Will be only called by admin. Emits the SetFeeRatio event.
     *
     * @param  _feeRatio  ratio in 1e18.
     */
    function setFeeRatio(uint256 _feeRatio) external onlyAdmin nonReentrant {
        require(_feeRatio <= 1e18, "The fee ratio cannot be over 100%");
        feeRatio = _feeRatio;
        emit SetFeeRatio(_feeRatio);
    }

    /**
     * @notice Number of seconds allowed for domain expiry.
     * @dev Will be only called by admin. Emits the SetMaxExpirationAllowed event.
     *
     * @param  time time in seconds
     */
    function setMaxExpirationAllowed(uint256 time)
        external
        onlyAdmin
        nonReentrant
    {
        maxExpirationAllowed = time;
        emit SetMaxExpirationAllowed(time);
    }
}
