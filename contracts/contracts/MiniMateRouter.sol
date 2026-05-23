// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title MiniMateRouter - AI-Powered Payment Router (CELO native)
/// @notice Process payments, track spending, categorize transactions using native CELO
contract MiniMateRouter is Ownable, ReentrancyGuard {

    enum Category { Food, Transport, Shopping, Bills, Entertainment, Health, Education, Savings, Other }

    struct Transaction {
        address from;
        address to;
        uint256 amount;
        Category category;
        string description;
        uint256 timestamp;
    }

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

    constructor() Ownable(msg.sender) {}

    /// @notice Send native CELO payment with category and description
    function pay(
        address _to,
        Category _category,
        string calldata _description
    ) external payable nonReentrant {
        require(_to != address(0), "Invalid recipient");
        require(msg.value > 0, "Amount must be > 0");
        require(_to != msg.sender, "Cannot pay yourself");

        payable(_to).transfer(msg.value);

        Transaction memory tx_ = Transaction({
            from: msg.sender,
            to: _to,
            amount: msg.value,
            category: _category,
            description: _description,
            timestamp: block.timestamp
        });

        allTransactions.push(tx_);
        userTransactions[msg.sender].push(tx_);
        spendingByCategory[msg.sender][_category] += msg.value;
        totalSpent[msg.sender] += msg.value;

        emit PaymentMade(msg.sender, _to, msg.value, _category, _description);
    }

    /// @notice Batch pay multiple recipients
    function batchPay(
        address[] calldata _recipients,
        Category _category,
        string calldata _description
    ) external payable nonReentrant {
        require(_recipients.length > 0, "No recipients");

        uint256 totalSent = 0;
        uint256 perRecipient = msg.value / _recipients.length;

        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0), "Invalid recipient");
            require(perRecipient > 0, "Amount must be > 0");

            payable(_recipients[i]).transfer(perRecipient);
            totalSent += perRecipient;

            Transaction memory tx_ = Transaction({
                from: msg.sender,
                to: _recipients[i],
                amount: perRecipient,
                category: _category,
                description: _description,
                timestamp: block.timestamp
            });

            allTransactions.push(tx_);
            userTransactions[msg.sender].push(tx_);
            spendingByCategory[msg.sender][_category] += perRecipient;

            emit PaymentMade(msg.sender, _recipients[i], perRecipient, _category, _description);
        }

        totalSpent[msg.sender] += totalSent;

        // Refund dust
        if (msg.value > totalSent) {
            payable(msg.sender).transfer(msg.value - totalSent);
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

    /// @notice Contract can receive CELO
    receive() external payable {}
}
