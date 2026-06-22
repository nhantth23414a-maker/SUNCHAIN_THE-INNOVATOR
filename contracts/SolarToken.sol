// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SolarToken
 * @dev Token đại diện cho quyền sở hữu năng lượng mặt trời
 * 1 SOLAR = 1 kWh năng lượng được token hóa
 */
contract SolarToken is ERC20, Ownable {

    // Mapping: project ID => total tokens allocated
    mapping(uint256 => uint256) public projectTokens;

    // Mapping: investor => project ID => tokens owned
    mapping(address => mapping(uint256 => uint256)) public investorProjectTokens;

    // Events
    event TokensMinted(address indexed investor, uint256 projectId, uint256 amount);
    event YieldDistributed(address indexed investor, uint256 amount);

    constructor() ERC20("SolarToken", "SOLAR") Ownable(msg.sender) {
        // Mint initial supply cho platform (100M tokens)
        _mint(msg.sender, 100_000_000 * 10**decimals());
    }

    /**
     * @dev Mint tokens khi investor đầu tư vào project
     */
    function mintForInvestment(
        address investor,
        uint256 projectId,
        uint256 amount
    ) external onlyOwner {
        _mint(investor, amount);
        projectTokens[projectId] += amount;
        investorProjectTokens[investor][projectId] += amount;

        emit TokensMinted(investor, projectId, amount);
    }

    /**
     * @dev Lấy số token investor sở hữu trong một project
     */
    function getInvestorProjectBalance(
        address investor,
        uint256 projectId
    ) external view returns (uint256) {
        return investorProjectTokens[investor][projectId];
    }

    /**
     * @dev Distribute yield cho investors
     */
    function distributeYield(address investor, uint256 amount) external onlyOwner {
        _mint(investor, amount);
        emit YieldDistributed(investor, amount);
    }
}