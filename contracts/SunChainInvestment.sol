// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface ISolarToken {
    function mintForInvestment(address to, uint256 amount) external;
}

contract SunChainInvestment is Ownable, ReentrancyGuard, Pausable {

    struct Project {
        string name;
        uint256 targetAmount;
        uint256 raisedAmount;
        uint256 apy;
        uint256 capacity;
        uint256 duration;
        uint256 startTime;
        address beneficiary;
        bool isActive;
        bool isFunded;
    }

    struct Investment {
        uint256 projectId;
        uint256 amount;
        uint256 timestamp;
        uint256 rewardsClaimed;
        bool isActive;
    }

    IERC20 public usdtToken;
    ISolarToken public solarToken;

    uint256 public projectCount;
    mapping(uint256 => Project) public projects;

    uint256 public investmentCount;
    mapping(uint256 => Investment) public investments;
    mapping(address => uint256[]) public userInvestments;
    mapping(uint256 => mapping(address => uint256[])) public projectInvestors;

    uint256 public constant MIN_INVESTMENT = 100 * 10**6;
    uint256 public constant PLATFORM_FEE = 200;
    uint256 public constant FEE_DENOMINATOR = 10000;

    address public feeCollector;

    event ProjectCreated(uint256 indexed projectId, string name, uint256 targetAmount);
    event ProjectActivated(uint256 indexed projectId);
    event ProjectDeactivated(uint256 indexed projectId);
    event InvestmentMade(uint256 indexed investmentId, uint256 indexed projectId, address indexed investor, uint256 amount);
    event RewardsClaimed(uint256 indexed investmentId, address indexed investor, uint256 amount);
    event InvestmentWithdrawn(uint256 indexed investmentId, address indexed investor, uint256 amount);
    event ProjectFunded(uint256 indexed projectId, uint256 totalRaised);

    constructor(address _usdtToken, address _solarToken) Ownable(msg.sender) {
        require(_usdtToken != address(0), "Invalid USDT address");
        require(_solarToken != address(0), "Invalid SolarToken address");
        usdtToken = IERC20(_usdtToken);
        solarToken = ISolarToken(_solarToken);
        feeCollector = msg.sender;
    }

    function createProject(
        string memory name,
        uint256 targetAmount,
        uint256 apy,
        uint256 capacity,
        uint256 duration,
        address beneficiary
    ) external onlyOwner {
        require(bytes(name).length > 0, "Name required");
        require(targetAmount > 0, "Target must be > 0");
        require(apy > 0 && apy <= 100, "APY must be 1-100%");
        require(beneficiary != address(0), "Invalid beneficiary");

        projectCount++;

        Project storage project = projects[projectCount];
        project.name = name;
        project.targetAmount = targetAmount * 10**6;
        project.apy = apy;
        project.capacity = capacity;
        project.duration = duration;
        project.beneficiary = beneficiary;
        project.startTime = block.timestamp;
        project.isActive = true;
        project.isFunded = false;

        emit ProjectCreated(projectCount, name, project.targetAmount);
    }

    function activateProject(uint256 projectId) external onlyOwner {
        require(projectId > 0 && projectId <= projectCount, "Invalid project ID");
        Project storage project = projects[projectId];
        require(!project.isActive, "Already active");

        project.isActive = true;
        emit ProjectActivated(projectId);
    }

    function deactivateProject(uint256 projectId) external onlyOwner {
        require(projectId > 0 && projectId <= projectCount, "Invalid project ID");
        Project storage project = projects[projectId];
        require(project.isActive, "Already inactive");

        project.isActive = false;
        emit ProjectDeactivated(projectId);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        feeCollector = _feeCollector;
    }

    function invest(uint256 projectId, uint256 amount) external nonReentrant whenNotPaused {
        require(projectId > 0 && projectId <= projectCount, "Invalid project ID");
        require(amount >= MIN_INVESTMENT, "Below minimum investment");

        Project storage project = projects[projectId];
        require(project.isActive, "Project not active");
        require(!project.isFunded, "Project already funded");
        require(project.raisedAmount + amount <= project.targetAmount, "Exceeds target");

        require(
            usdtToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        uint256 fee = (amount * PLATFORM_FEE) / FEE_DENOMINATOR;
        uint256 netAmount = amount - fee;

        if (fee > 0) {
            require(usdtToken.transfer(feeCollector, fee), "Fee transfer failed");
        }

        project.raisedAmount += netAmount;

        investmentCount++;
        Investment storage investment = investments[investmentCount];
        investment.projectId = projectId;
        investment.amount = netAmount;
        investment.timestamp = block.timestamp;
        investment.isActive = true;

        userInvestments[msg.sender].push(investmentCount);
        projectInvestors[projectId][msg.sender].push(investmentCount);

        try solarToken.mintForInvestment(msg.sender, netAmount) {} catch {}

        emit InvestmentMade(investmentCount, projectId, msg.sender, netAmount);

        if (project.raisedAmount >= project.targetAmount) {
            project.isFunded = true;
            require(
                usdtToken.transfer(project.beneficiary, project.raisedAmount),
                "Beneficiary transfer failed"
            );
            emit ProjectFunded(projectId, project.raisedAmount);
        }
    }

    function calculateRewards(uint256 investmentId) public view returns (uint256) {
        Investment storage investment = investments[investmentId];
        if (!investment.isActive) return 0;

        Project storage project = projects[investment.projectId];

        uint256 elapsed = block.timestamp - investment.timestamp;
        uint256 daysElapsed = elapsed / 1 days;

        uint256 totalRewards = (investment.amount * project.apy * daysElapsed) / (365 * 100);

        if (totalRewards > investment.rewardsClaimed) {
            return totalRewards - investment.rewardsClaimed;
        }

        return 0;
    }

    function claimRewards(uint256 investmentId) external nonReentrant {
        require(investmentId > 0 && investmentId <= investmentCount, "Invalid investment ID");
        Investment storage investment = investments[investmentId];
        require(investment.isActive, "Investment not active");

        uint256 rewards = calculateRewards(investmentId);
        require(rewards > 0, "No rewards to claim");

        investment.rewardsClaimed += rewards;

        require(usdtToken.transfer(msg.sender, rewards), "Reward transfer failed");

        emit RewardsClaimed(investmentId, msg.sender, rewards);
    }

    function withdrawInvestment(uint256 investmentId) external nonReentrant {
        require(investmentId > 0 && investmentId <= investmentCount, "Invalid investment ID");
        Investment storage investment = investments[investmentId];
        require(investment.isActive, "Already withdrawn");

        Project storage project = projects[investment.projectId];

        uint256 endTime = investment.timestamp + (project.duration * 1 days);
        require(block.timestamp >= endTime, "Lock period not ended");

        uint256 rewards = calculateRewards(investmentId);
        if (rewards > 0) {
            investment.rewardsClaimed += rewards;
            require(usdtToken.transfer(msg.sender, rewards), "Reward transfer failed");
        }

        uint256 principal = investment.amount;
        investment.isActive = false;

        require(usdtToken.transfer(msg.sender, principal), "Principal transfer failed");

        emit InvestmentWithdrawn(investmentId, msg.sender, principal);
    }

    function getProject(uint256 projectId) external view returns (
        string memory name,
        uint256 targetAmount,
        uint256 raisedAmount,
        uint256 apy,
        uint256 capacity,
        uint256 duration,
        uint256 startTime,
        address beneficiary,
        bool isActive,
        bool isFunded
    ) {
        require(projectId > 0 && projectId <= projectCount, "Invalid project ID");
        Project storage project = projects[projectId];

        return (
            project.name,
            project.targetAmount,
            project.raisedAmount,
            project.apy,
            project.capacity,
            project.duration,
            project.startTime,
            project.beneficiary,
            project.isActive,
            project.isFunded
        );
    }

    function getUserInvestments(address user) external view returns (uint256[] memory) {
        return userInvestments[user];
    }

    function getInvestment(uint256 investmentId) external view returns (
        uint256 projectId,
        uint256 amount,
        uint256 timestamp,
        uint256 rewardsClaimed,
        bool isActive,
        uint256 pendingRewards
    ) {
        require(investmentId > 0 && investmentId <= investmentCount, "Invalid investment ID");
        Investment storage investment = investments[investmentId];

        return (
            investment.projectId,
            investment.amount,
            investment.timestamp,
            investment.rewardsClaimed,
            investment.isActive,
            calculateRewards(investmentId)
        );
    }

    function getAllProjects() external view returns (Project[] memory) {
        Project[] memory allProjects = new Project[](projectCount);

        for (uint256 i = 1; i <= projectCount; i++) {
            allProjects[i - 1] = projects[i];
        }

        return allProjects;
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner whenPaused {
        require(IERC20(token).transfer(owner(), amount), "Emergency withdraw failed");
    }
}