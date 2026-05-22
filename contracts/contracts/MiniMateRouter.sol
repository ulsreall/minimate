// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title MiniMateRouter - AI-Powered Payment Router
/// @notice Process payments, track spending, categorize transactions
contract MiniMateRouter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Category { Food, Transport, Shopping, Bills, Entertainment, Health, Education, Savings, Other }

    struct Transaction {
        address from;
        address to;
        uint256 amount;
        Category category;
        string description;
        uint256 timestamp;
    }

    IERC20 public immutable cUSD;
    Transaction[] public allTransactions;
    mapping(address => Transaction[]) public userTransactions;
    mapping(address => mapping(Category => uint256)) public spendingByCategory;
    mapping(address => uint256) public totalSpent;

    event PaymentMade(
        address indexed from,
        address indexed to,
        uint256 amount,
        Category category,
        string description
    );

    constructor(address _cUSD) Ownable(msg.sender) {
        cUSD = IERC20(_cUSD);
    }

    /// @notice Send payment with category and description
    function pay(
        address _to,
        uint256 _amount,
        Category _category,
        string calldata _description
    ) external nonReentrant {
        require(_to != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be > 0");
        require(_to != msg.sender, "Cannot pay yourself");

        cUSD.safeTransferFrom(msg.sender, _to, _amount);

        Transaction memory tx_ = Transaction({
            from: msg.sender,
            to: _to,
            amount: _amount,
            category: _category,
            description: _description,
            timestamp: block.timestamp
        });

        allTransactions.push(tx_);
        userTransactions[msg.sender].push(tx_);
        spendingByCategory[msg.sender][_category] += _amount;
        totalSpent[msg.sender] += _amount;

        emit PaymentMade(msg.sender, _to, _amount, _category, _description);
    }

    /// @notice Batch pay multiple recipients
    function batchPay(
        address[] calldata _recipients,
        uint256[] calldata _amounts,
        Category _category,
        string calldata _description
    ) external nonReentrant {
        require(_recipients.length == _amounts.length, "Length mismatch");

        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0), "Invalid recipient");
            require(_amounts[i] > 0, "Amount must be > 0");

            cUSD.safeTransferFrom(msg.sender, _recipients[i], _amounts[i]);

            Transaction memory tx_ = Transaction({
                from: msg.sender,
                to: _recipients[i],
                amount: _amounts[i],
                category: _category,
                description: _description,
                timestamp: block.timestamp
            });

            allTransactions.push(tx_);
            userTransactions[msg.sender].push(tx_);
            spendingByCategory[msg.sender][_category] += _amounts[i];
            totalSpent[msg.sender] += _amounts[i];

            emit PaymentMade(msg.sender, _recipients[i], _amounts[i], _category, _description);
        }
    }

    /// @notice Get user's transaction history
    function getTransactions(address _user) external view returns (Transaction[] memory) {
        return userTransactions[_user];
    }

    /// @notice Get spending breakdown by category
    function getSpendingBreakdown(address _user) external view returns (uint256[9] memory) {
        uint256[9] memory breakdown;
        for (uint256 i = 0; i < 9; i++) {
            breakdown[i] = spendingByCategory[_user][Category(i)];
        }
        return breakdown;
    }

    /// @notice Get recent transactions (last N)
    function getRecentTransactions(address _user, uint256 _count) external view returns (Transaction[] memory) {
        Transaction[] memory userTxs = userTransactions[_user];
        uint256 len = userTxs.length;
        if (_count > len) _count = len;

        Transaction[] memory recent = new Transaction[](_count);
        for (uint256 i = 0; i < _count; i++) {
            recent[i] = userTxs[len - _count + i];
        }
        return recent;
    }

    /// @notice Get transaction count
    function getTransactionCount(address _user) external view returns (uint256) {
        return userTransactions[_user].length;
    }
}
