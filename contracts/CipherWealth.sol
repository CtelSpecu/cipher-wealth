// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title CipherWealth - Encrypted Wealth Management Contract
/// @author cipher-wealth
/// @notice A privacy-preserving wealth management system using FHEVM for encrypted balances
/// @dev This contract demonstrates a complete encrypted data flow: deposit, withdraw, and balance viewing
contract CipherWealth is SepoliaConfig {
    /// @notice Mapping of user addresses to their encrypted balances
    mapping(address => euint64) private balances;

    /// @notice Event emitted when a user deposits encrypted funds
    /// @param user The address of the user making the deposit
    event Deposit(address indexed user);

    /// @notice Event emitted when a user withdraws encrypted funds
    /// @param user The address of the user making the withdrawal
    event Withdrawal(address indexed user);

    /// @notice Deposits an encrypted amount to the caller's balance
    /// @param inputEuint64 The encrypted input amount to deposit
    /// @param inputProof The proof for the encrypted input
    /// @dev The amount is added to the user's existing balance using FHE addition
    function deposit(externalEuint64 inputEuint64, bytes calldata inputProof) external {
        // Convert external encrypted input to internal encrypted value
        euint64 encryptedAmount = FHE.fromExternal(inputEuint64, inputProof);

        // Add the encrypted amount to the user's balance
        balances[msg.sender] = FHE.add(balances[msg.sender], encryptedAmount);

        // Allow the contract and user to access the updated balance
        FHE.allowThis(balances[msg.sender]);
        FHE.allow(balances[msg.sender], msg.sender);

        emit Deposit(msg.sender);
    }

    /// @notice Withdraws an encrypted amount from the caller's balance
    /// @param inputEuint64 The encrypted input amount to withdraw
    /// @param inputProof The proof for the encrypted input
    /// @dev The amount is subtracted from the user's balance using FHE subtraction
    /// @dev Note: This example omits underflow checks for simplicity. In production, implement proper checks.
    function withdraw(externalEuint64 inputEuint64, bytes calldata inputProof) external {
        // Convert external encrypted input to internal encrypted value
        euint64 encryptedAmount = FHE.fromExternal(inputEuint64, inputProof);

        // Subtract the encrypted amount from the user's balance
        balances[msg.sender] = FHE.sub(balances[msg.sender], encryptedAmount);

        // Allow the contract and user to access the updated balance
        FHE.allowThis(balances[msg.sender]);
        FHE.allow(balances[msg.sender], msg.sender);

        emit Withdrawal(msg.sender);
    }

    /// @notice Returns the encrypted balance of the caller
    /// @return The encrypted balance as euint64
    /// @dev The balance can only be decrypted by the user who owns it
    function getBalance() external view returns (euint64) {
        return balances[msg.sender];
    }

    /// @notice Returns the encrypted balance of a specific user
    /// @param user The address of the user to query
    /// @return The encrypted balance as euint64
    /// @dev Only the user themselves can decrypt their balance
    function getBalanceOf(address user) external view returns (euint64) {
        return balances[user];
    }

    /// @notice Transfers an encrypted amount from the caller to another user
    /// @param to The recipient address
    /// @param inputEuint64 The encrypted input amount to transfer
    /// @param inputProof The proof for the encrypted input
    /// @dev This demonstrates encrypted peer-to-peer transfers
    function transfer(address to, externalEuint64 inputEuint64, bytes calldata inputProof) external {
        require(to != address(0), "Cannot transfer to zero address");
        require(to != msg.sender, "Cannot transfer to yourself");

        // Convert external encrypted input to internal encrypted value
        euint64 encryptedAmount = FHE.fromExternal(inputEuint64, inputProof);

        // Subtract from sender's balance
        balances[msg.sender] = FHE.sub(balances[msg.sender], encryptedAmount);

        // Add to recipient's balance
        balances[to] = FHE.add(balances[to], encryptedAmount);

        // Allow access to updated balances
        FHE.allowThis(balances[msg.sender]);
        FHE.allow(balances[msg.sender], msg.sender);
        FHE.allowThis(balances[to]);
        FHE.allow(balances[to], to);

        emit Withdrawal(msg.sender);
        emit Deposit(to);
    }
}
