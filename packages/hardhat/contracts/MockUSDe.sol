// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockUSDe is ERC20, Ownable {
    // Add custom errors
    error InsufficientBalance();
    error InsufficientAllowance();
    error TransferFailed();

    constructor() ERC20("Mock USDe", "USDe") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override returns (bool) {
        address spender = _msgSender();
        if (amount > balanceOf(from)) revert InsufficientBalance();
        if (amount > allowance(from, spender)) revert InsufficientAllowance();
        
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        
        return true;
    }
}