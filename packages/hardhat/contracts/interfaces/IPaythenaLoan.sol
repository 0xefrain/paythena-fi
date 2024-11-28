// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPaythenaLoan {
    function getLoanBalance(address borrower) external view returns (uint256);
}