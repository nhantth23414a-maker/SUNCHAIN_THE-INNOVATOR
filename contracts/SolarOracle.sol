// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SolarOracle
 * @dev Oracle để cung cấp dữ liệu sản lượng điện mặt trời
 * Trong production, sẽ tích hợp với Chainlink hoặc API3
 */
contract SolarOracle is Ownable {

    struct EnergyData {
        uint256 projectId;
        uint256 energyProduced; // kWh
        uint256 timestamp;
        uint256 co2Reduced; // kg
        bool verified;
    }

    // Project ID => month => EnergyData
    mapping(uint256 => mapping(uint256 => EnergyData)) public energyRecords;

    // Authorized data providers
    mapping(address => bool) public authorizedProviders;

    // Events
    event EnergyDataSubmitted(uint256 indexed projectId, uint256 month, uint256 energyProduced);
    event DataVerified(uint256 indexed projectId, uint256 month);
    event ProviderAuthorized(address indexed provider);

    constructor() Ownable(msg.sender) {
        authorizedProviders[msg.sender] = true;
    }

    /**
     * @dev Authorize data provider
     */
    function authorizeProvider(address provider) external onlyOwner {
        authorizedProviders[provider] = true;
        emit ProviderAuthorized(provider);
    }

    /**
     * @dev Submit energy data
     */
    function submitEnergyData(
        uint256 projectId,
        uint256 month,
        uint256 energyProduced
    ) external {
        require(authorizedProviders[msg.sender], "Not authorized");

        // Calculate CO2 reduction (1 kWh = ~0.5 kg CO2)
        uint256 co2Reduced = energyProduced * 5 / 10;

        energyRecords[projectId][month] = EnergyData({
            projectId: projectId,
            energyProduced: energyProduced,
            timestamp: block.timestamp,
            co2Reduced: co2Reduced,
            verified: false
        });

        emit EnergyDataSubmitted(projectId, month, energyProduced);
    }

    /**
     * @dev Verify energy data
     */
    function verifyData(uint256 projectId, uint256 month) external onlyOwner {
        energyRecords[projectId][month].verified = true;
        emit DataVerified(projectId, month);
    }

    /**
     * @dev Get energy data
     */
    function getEnergyData(
        uint256 projectId,
        uint256 month
    ) external view returns (EnergyData memory) {
        return energyRecords[projectId][month];
    }

    /**
     * @dev Get total energy produced for a project
     */
    function getTotalEnergy(
        uint256 projectId,
        uint256 fromMonth,
        uint256 toMonth
    ) external view returns (uint256 total) {
        for (uint256 i = fromMonth; i <= toMonth; i++) {
            total += energyRecords[projectId][i].energyProduced;
        }
        return total;
    }
}