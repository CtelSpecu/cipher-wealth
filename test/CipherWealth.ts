import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { CipherWealth, CipherWealth__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("CipherWealth")) as CipherWealth__factory;
  const cipherWealthContract = (await factory.deploy()) as CipherWealth;
  const cipherWealthContractAddress = await cipherWealthContract.getAddress();

  return { cipherWealthContract, cipherWealthContractAddress };
}

describe("CipherWealth", function () {
  let signers: Signers;
  let cipherWealthContract: CipherWealth;
  let cipherWealthContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ cipherWealthContract, cipherWealthContractAddress } = await deployFixture());
  });

  it("encrypted balance should be uninitialized after deployment", async function () {
    const encryptedBalance = await cipherWealthContract.connect(signers.alice).getBalance();
    // Expect initial balance to be bytes32(0) after deployment,
    // (meaning the encrypted balance value is uninitialized)
    expect(encryptedBalance).to.eq(ethers.ZeroHash);
  });

  it("should deposit encrypted amount successfully", async function () {
    const encryptedBalanceBeforeDeposit = await cipherWealthContract.connect(signers.alice).getBalance();
    expect(encryptedBalanceBeforeDeposit).to.eq(ethers.ZeroHash);

    // Encrypt constant 1000 as a euint64
    const clearAmount = 1000;
    const encryptedAmount = await fhevm
      .createEncryptedInput(cipherWealthContractAddress, signers.alice.address)
      .add64(clearAmount)
      .encrypt();

    const tx = await cipherWealthContract
      .connect(signers.alice)
      .deposit(encryptedAmount.handles[0], encryptedAmount.inputProof);
    await tx.wait();

    const encryptedBalanceAfterDeposit = await cipherWealthContract.connect(signers.alice).getBalance();
    const clearBalanceAfterDeposit = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedBalanceAfterDeposit,
      cipherWealthContractAddress,
      signers.alice,
    );

    expect(clearBalanceAfterDeposit).to.eq(clearAmount);
  });

  it("should handle multiple deposits correctly", async function () {
    // First deposit: 500
    const clearAmount1 = 500;
    const encryptedAmount1 = await fhevm
      .createEncryptedInput(cipherWealthContractAddress, signers.alice.address)
      .add64(clearAmount1)
      .encrypt();

    let tx = await cipherWealthContract
      .connect(signers.alice)
      .deposit(encryptedAmount1.handles[0], encryptedAmount1.inputProof);
    await tx.wait();

    // Second deposit: 300
    const clearAmount2 = 300;
    const encryptedAmount2 = await fhevm
      .createEncryptedInput(cipherWealthContractAddress, signers.alice.address)
      .add64(clearAmount2)
      .encrypt();

    tx = await cipherWealthContract
      .connect(signers.alice)
      .deposit(encryptedAmount2.handles[0], encryptedAmount2.inputProof);
    await tx.wait();

    const encryptedBalance = await cipherWealthContract.connect(signers.alice).getBalance();
    const clearBalance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedBalance,
      cipherWealthContractAddress,
      signers.alice,
    );

    expect(clearBalance).to.eq(clearAmount1 + clearAmount2);
  });

  it("should withdraw encrypted amount successfully", async function () {
    // First deposit 1000
    const clearDepositAmount = 1000;
    const encryptedDepositAmount = await fhevm
      .createEncryptedInput(cipherWealthContractAddress, signers.alice.address)
      .add64(clearDepositAmount)
      .encrypt();

    let tx = await cipherWealthContract
      .connect(signers.alice)
      .deposit(encryptedDepositAmount.handles[0], encryptedDepositAmount.inputProof);
    await tx.wait();

    // Then withdraw 400
    const clearWithdrawAmount = 400;
    const encryptedWithdrawAmount = await fhevm
      .createEncryptedInput(cipherWealthContractAddress, signers.alice.address)
      .add64(clearWithdrawAmount)
      .encrypt();

    tx = await cipherWealthContract
      .connect(signers.alice)
      .withdraw(encryptedWithdrawAmount.handles[0], encryptedWithdrawAmount.inputProof);
    await tx.wait();

    const encryptedBalance = await cipherWealthContract.connect(signers.alice).getBalance();
    const clearBalance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedBalance,
      cipherWealthContractAddress,
      signers.alice,
    );

    expect(clearBalance).to.eq(clearDepositAmount - clearWithdrawAmount);
  });

  it("should transfer encrypted amount between users", async function () {
    // Alice deposits 1000
    const clearDepositAmount = 1000;
    const encryptedDepositAmount = await fhevm
      .createEncryptedInput(cipherWealthContractAddress, signers.alice.address)
      .add64(clearDepositAmount)
      .encrypt();

    let tx = await cipherWealthContract
      .connect(signers.alice)
      .deposit(encryptedDepositAmount.handles[0], encryptedDepositAmount.inputProof);
    await tx.wait();

    // Alice transfers 300 to Bob
    const clearTransferAmount = 300;
    const encryptedTransferAmount = await fhevm
      .createEncryptedInput(cipherWealthContractAddress, signers.alice.address)
      .add64(clearTransferAmount)
      .encrypt();

    tx = await cipherWealthContract
      .connect(signers.alice)
      .transfer(signers.bob.address, encryptedTransferAmount.handles[0], encryptedTransferAmount.inputProof);
    await tx.wait();

    // Check Alice's balance
    const encryptedAliceBalance = await cipherWealthContract.connect(signers.alice).getBalance();
    const clearAliceBalance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedAliceBalance,
      cipherWealthContractAddress,
      signers.alice,
    );

    expect(clearAliceBalance).to.eq(clearDepositAmount - clearTransferAmount);

    // Check Bob's balance
    const encryptedBobBalance = await cipherWealthContract.connect(signers.bob).getBalance();
    const clearBobBalance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedBobBalance,
      cipherWealthContractAddress,
      signers.bob,
    );

    expect(clearBobBalance).to.eq(clearTransferAmount);
  });

  it("should not allow transfer to zero address", async function () {
    const clearAmount = 100;
    const encryptedAmount = await fhevm
      .createEncryptedInput(cipherWealthContractAddress, signers.alice.address)
      .add64(clearAmount)
      .encrypt();

    await expect(
      cipherWealthContract
        .connect(signers.alice)
        .transfer(ethers.ZeroAddress, encryptedAmount.handles[0], encryptedAmount.inputProof),
    ).to.be.revertedWith("Cannot transfer to zero address");
  });

  it("should not allow transfer to self", async function () {
    const clearAmount = 100;
    const encryptedAmount = await fhevm
      .createEncryptedInput(cipherWealthContractAddress, signers.alice.address)
      .add64(clearAmount)
      .encrypt();

    await expect(
      cipherWealthContract
        .connect(signers.alice)
        .transfer(signers.alice.address, encryptedAmount.handles[0], encryptedAmount.inputProof),
    ).to.be.revertedWith("Cannot transfer to yourself");
  });

  it("should allow querying balance of other users", async function () {
    // Alice deposits 500
    const clearAmount = 500;
    const encryptedAmount = await fhevm
      .createEncryptedInput(cipherWealthContractAddress, signers.alice.address)
      .add64(clearAmount)
      .encrypt();

    const tx = await cipherWealthContract
      .connect(signers.alice)
      .deposit(encryptedAmount.handles[0], encryptedAmount.inputProof);
    await tx.wait();

    // Bob queries Alice's balance (but cannot decrypt it without permission)
    const encryptedAliceBalance = await cipherWealthContract.connect(signers.bob).getBalanceOf(signers.alice.address);
    
    // The balance exists but Bob cannot decrypt it (only Alice can)
    expect(encryptedAliceBalance).to.not.eq(ethers.ZeroHash);
  });
});
