// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDT
 * @dev USDT giả để test - ai cũng mint được
 * CHỈ DÙNG CHO TESTNET!
 */
contract MockUSDT is ERC20 {

    constructor() ERC20("Mock USDT", "USDT") {
        // Mint 1 million USDT cho deployer
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }

    /**
     * @dev Override decimals to match USDT (6 decimals)
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @dev Faucet - ai cũng claim được 1000 USDT miễn phí
     * Rate limit: 1 lần/ngày per address
     */
    mapping(address => uint256) public lastClaim;

    function faucet() external {
        require(
            block.timestamp > lastClaim[msg.sender] + 1 days,
            "Can only claim once per day"
        );

        lastClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, 1000 * 10**decimals());
    }

    /**
     * @dev Admin mint (for testing)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}