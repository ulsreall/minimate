// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title MiniMateVault - AI-Powered Savings Vault
/// @notice Users create savings goals, AI auto-saves on their behalf
contract MiniMateVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Goal {
        string name;
        uint256 targetAmount;
        uint256 savedAmount;
        uint256 deadline;
        uint256 autoSaveAmount;   // amount per auto-save
        uint256 autoSaveInterval; // seconds between auto-saves
        uint256 lastAutoSave;
        bool active;
        bool completed;
    }

    IERC20 public immutable cUSD;
    mapping(address => Goal[]) public goals;
    mapping(address => uint256) public totalSaved;

    event GoalCreated(address indexed user, uint256 indexed goalId, string name, uint256 target);
    event Deposited(address indexed user, uint256 indexed goalId, uint256 amount);
    event Withdrawn(address indexed user, uint256 indexed goalId, uint256 amount);
    event AutoSaveSet(address indexed user, uint256 indexed goalId, uint256 amount, uint256 interval);
    event GoalCompleted(address indexed user, uint256 indexed goalId);

    constructor(address _cUSD) Ownable(msg.sender) {
        cUSD = IERC20(_cUSD);
    }

    /// @notice Create a new savings goal
    function createGoal(
        string calldata _name,
        uint256 _targetAmount,
        uint256 _deadline
    ) external returns (uint256) {
        require(_targetAmount > 0, "Target must be > 0");
        require(_deadline > block.timestamp, "Deadline must be future");

        goals[msg.sender].push(Goal({
            name: _name,
            targetAmount: _targetAmount,
            savedAmount: 0,
            deadline: _deadline,
            autoSaveAmount: 0,
            autoSaveInterval: 0,
            lastAutoSave: 0,
            active: true,
            completed: false
        }));

        uint256 goalId = goals[msg.sender].length - 1;
        emit GoalCreated(msg.sender, goalId, _name, _targetAmount);
        return goalId;
    }

    /// @notice Deposit to a savings goal
    function deposit(uint256 _goalId, uint256 _amount) external nonReentrant {
        Goal storage goal = goals[msg.sender][_goalId];
        require(goal.active, "Goal not active");
        require(!goal.completed, "Goal completed");
        require(_amount > 0, "Amount must be > 0");

        cUSD.safeTransferFrom(msg.sender, address(this), _amount);
        goal.savedAmount += _amount;
        totalSaved[msg.sender] += _amount;

        emit Deposited(msg.sender, _goalId, _amount);

        if (goal.savedAmount >= goal.targetAmount) {
            goal.completed = true;
            emit GoalCompleted(msg.sender, _goalId);
        }
    }

    /// @notice Withdraw from a savings goal
    function withdraw(uint256 _goalId, uint256 _amount) external nonReentrant {
        Goal storage goal = goals[msg.sender][_goalId];
        require(goal.active, "Goal not active");
        require(_amount <= goal.savedAmount, "Insufficient saved");

        goal.savedAmount -= _amount;
        totalSaved[msg.sender] -= _amount;
        cUSD.safeTransfer(msg.sender, _amount);

        emit Withdrawn(msg.sender, _goalId, _amount);
    }

    /// @notice Set auto-save parameters (AI calls this)
    function setAutoSave(uint256 _goalId, uint256 _amount, uint256 _interval) external {
        Goal storage goal = goals[msg.sender][_goalId];
        require(goal.active, "Goal not active");
        require(_amount > 0, "Amount must be > 0");
        require(_interval >= 1 hours, "Min interval 1 hour");

        goal.autoSaveAmount = _amount;
        goal.autoSaveInterval = _interval;

        emit AutoSaveSet(msg.sender, _goalId, _amount, _interval);
    }

    /// @notice Execute auto-save (can be called by anyone, pulls from user's approved balance)
    function executeAutoSave(address _user, uint256 _goalId) external nonReentrant {
        Goal storage goal = goals[_user][_goalId];
        require(goal.active, "Goal not active");
        require(!goal.completed, "Goal completed");
        require(goal.autoSaveAmount > 0, "Auto-save not set");
        require(
            block.timestamp >= goal.lastAutoSave + goal.autoSaveInterval,
            "Too early"
        );

        uint256 allowance = cUSD.allowance(_user, address(this));
        require(allowance >= goal.autoSaveAmount, "Insufficient allowance");

        cUSD.safeTransferFrom(_user, address(this), goal.autoSaveAmount);
        goal.savedAmount += goal.autoSaveAmount;
        goal.lastAutoSave = block.timestamp;
        totalSaved[_user] += goal.autoSaveAmount;

        emit Deposited(_user, _goalId, goal.autoSaveAmount);

        if (goal.savedAmount >= goal.targetAmount) {
            goal.completed = true;
            emit GoalCompleted(_user, _goalId);
        }
    }

    /// @notice Get all goals for a user
    function getGoals(address _user) external view returns (Goal[] memory) {
        return goals[_user];
    }

    /// @notice Get goal count
    function getGoalCount(address _user) external view returns (uint256) {
        return goals[_user].length;
    }
}
