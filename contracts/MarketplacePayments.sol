// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "./IBEP20.sol";
import "./Ownable.sol";

contract MarketplacePayments is Ownable {
    enum State {
        Pending,
        Completed,
        Released,
        Reverted,
        Disputed
    }

    struct Order {
        uint256 orderId;
        address buyer;
        address seller;
        uint256 dueDate;
        address paymentToken;
        uint256 amount;
        uint256 fee;
        State state;
        uint256 createdAt;
        uint256 completedAt;
        uint256 releasedAt;
    }

    uint256 private totalOrders = 0;

    mapping(uint256 => Order) orders;
    mapping(address => bool) allowedTokens;

    uint256 fee = 20;

    modifier condition(bool _condition, string memory message) {
        require(_condition, message);
        _;
    }

    event OrderCreated(uint256 orderId);

    event OrderCompleted(uint256 orderId, address indexed caller);
    event OrderReverted(uint256 orderId, address indexed caller);
    event OrderCompletedAndReleased(uint256 orderId, address indexed caller);

    function isTokenAllowed(address _tokenAddress) public view returns (bool) {
        return allowedTokens[_tokenAddress];
    }

    function updateTokensList(
        address _tokenAddress,
        bool allowed
    ) public onlyOwner returns (bool) {
        allowedTokens[_tokenAddress] = allowed;
        return true;
    }

    function createAndDeposit(
        address sellerAddress,
        uint256 dueDateTimestamp,
        address _paymentToken,
        uint256 _amount
    )
        public
        condition(
            sellerAddress != _msgSender(),
            "Error: Seller cannot be buyer"
        )
        condition(dueDateTimestamp > block.timestamp, "Error: Invalid Due date")
        condition(allowedTokens[_paymentToken], "Error: Invalid payment token")
        condition(_amount > 0, "Error: Invalid amount")
        returns (bool)
    {
        totalOrders += 1;
        Order storage order = orders[totalOrders];
        order.orderId = totalOrders;
        order.seller = sellerAddress;
        order.buyer = _msgSender();
        order.dueDate = dueDateTimestamp;
        order.paymentToken = _paymentToken;
        order.state = State.Pending;
        order.amount = _amount;
        order.fee = fee;
        order.createdAt = block.timestamp;

        IBEP20(_paymentToken).transferFrom(
            _msgSender(),
            address(this),
            _amount
        );

        emit OrderCreated(totalOrders);
        return true;
    }

    function markComplete(
        uint256 orderId
    )
        public
        condition(
            (orders[orderId].state != State.Disputed ||
                _msgSender() == owner()),
            "Error: Caller not seller/owner"
        )
        condition(
            (orders[orderId].buyer == _msgSender() || _msgSender() == owner()),
            "Error: Caller not buyer/owner"
        )
        condition(
            orders[orderId].state == State.Pending,
            "Error: Invalid current state"
        )
        returns (bool)
    {
        Order storage order = orders[orderId];
        order.state = State.Completed;
        order.completedAt = block.timestamp;

        emit OrderCompleted(orderId, _msgSender());

        return true;
    }

    function markPending(uint256 orderId) public returns (bool) {
        Order storage order = orders[orderId];
        order.state = State.Pending;
        order.completedAt = block.timestamp;

        emit OrderCompleted(orderId, _msgSender());

        return true;
    }

    function markReleased(uint256 orderId) public returns (State) {
        Order storage order = orders[orderId];
        order.state = State.Released;
        order.completedAt = block.timestamp;

        return State.Released;
    }

    function markReverted(uint256 orderId) public returns (bool) {
        Order storage order = orders[orderId];
        order.state = State.Reverted;
        order.completedAt = block.timestamp;

        emit OrderCompleted(orderId, _msgSender());

        return true;
    }

    function markCompleteAndreleaseFundsToSeller(
        uint256 orderId
    )
        public
        condition(
            (orders[orderId].state != State.Disputed ||
                _msgSender() == owner()),
            "Error: Caller not seller/owner"
        )
        condition(
            (orders[orderId].buyer == _msgSender() || _msgSender() == owner()),
            "Error: Caller not buyer/owner"
        )
        condition(
            orders[orderId].state == State.Pending,
            "Error: Invalid current state"
        )
        condition(
            (orders[orderId].dueDate <= block.timestamp),
            "Error: Cannot release funds before dueDate"
        )
    {
        Order storage order = orders[orderId];
        order.completedAt = block.timestamp;
        order.releasedAt = block.timestamp;
        order.state = State.Released;

        emit OrderCompletedAndReleased(orderId, _msgSender());
        uint256 feeValue = (order.amount * fee) / 10 ** 3;
        IBEP20(order.paymentToken).transfer(
            order.seller,
            order.amount - feeValue
        );
        IBEP20(order.paymentToken).transfer(owner(), feeValue);
    }

    function releaseFundsToBuyer(
        uint256 orderId
    )
        public
        condition(
            (orders[orderId].state != State.Disputed ||
                _msgSender() == owner()),
            "Error: Caller not seller/owner"
        )
        condition(
            (orders[orderId].seller == _msgSender() || _msgSender() == owner()),
            "Error: Caller not seller/owner"
        )
        condition(
            ((orders[orderId].state != State.Released) ||
                (orders[orderId].state != State.Reverted)),
            "Error: Invalid current state"
        )
        condition(
            (orders[orderId].dueDate <= block.timestamp),
            "Error: Cannot release funds before dueDate"
        )
    {
        Order storage order = orders[orderId];
        order.releasedAt = block.timestamp;
        order.state = State.Reverted;

        emit OrderReverted(orderId, _msgSender());

        IBEP20(order.paymentToken).transfer(order.buyer, order.amount);
    }

    function claimFundsFromBuyer(
        uint256 orderId
    )
        public
        condition(
            (orders[orderId].state != State.Disputed ||
                _msgSender() == owner()),
            "Error: Caller not seller/owner"
        )
        condition(
            (orders[orderId].seller == _msgSender() || _msgSender() == owner()),
            "Error: Caller not seller/owner"
        )
        condition(
            (orders[orderId].state == State.Completed ||
                (orders[orderId].state != State.Released)),
            "Error: Invalid current state"
        )
        condition(
            (orders[orderId].dueDate <= block.timestamp),
            "Error: Cannot claim funds before dueDate"
        )
    {
        Order storage order = orders[orderId];
        order.releasedAt = block.timestamp;
        order.state = State.Released;

        emit OrderCompletedAndReleased(orderId, _msgSender());
        uint256 feeValue = (order.amount * fee) / 10 ** 3;

        IBEP20(order.paymentToken).transfer(
            order.buyer,
            order.amount - feeValue
        );
        IBEP20(order.paymentToken).transfer(owner(), feeValue);
    }

    function disputeOrder(
        uint256 orderId
    )
        public
        condition(
            (orders[orderId].dueDate > block.timestamp),
            "Error: Cannot claim funds before dueDate"
        )
        condition(
            (orders[orderId].state != State.Completed),
            "Error: The order is completed."
        )
    {
        Order storage order = orders[orderId];
        order.state = State.Disputed;
    }

    function setTransactionFee(
        uint256 _newFee
    )
        public
        condition(owner() == _msgSender(), "Error: Caller not owner")
        returns (bool)
    {
        fee = _newFee;
        return true;
    }

    function orderDetails(
        uint256 orderId
    )
        public
        view
        condition(
            (orders[orderId].seller == _msgSender() ||
                _msgSender() == owner() ||
                orders[orderId].buyer == _msgSender()),
            "Error: Caller not seller/buyer/owner"
        )
        returns (
            address buyer,
            address seller,
            address paymentToken,
            State state,
            uint256 dueDate,
            uint256 amount,
            uint256 fees,
            uint256 createdAt,
            uint256 releasedAt,
            uint256 completedAt
        )
    {
        Order memory order = orders[orderId];
        return (
            order.buyer,
            order.seller,
            order.paymentToken,
            order.state,
            order.dueDate,
            order.amount,
            order.fee,
            order.createdAt,
            order.releasedAt,
            order.completedAt
        );
    }
}
