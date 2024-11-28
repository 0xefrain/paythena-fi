// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPaythenaStaking {
    function getStakedAmount(address account) external view returns (uint256);
}