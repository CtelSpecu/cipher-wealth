import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { CipherWealth, CipherWealth__factory } from "../types";
import { expect } from "chai";

type Signers = {
  deployer: HardhatEthersSigner;
};

async function getContract() {
  const factory = (await ethers.getContractFactory("CipherWealth")) as CipherWealth__factory;
  const cipherWealthContract = factory.attach(
    process.env.CIPHER_WEALTH_ADDRESS || "0x0000000000000000000000000000000000000000",
  ) as CipherWealth;
  const cipherWealthContractAddress = await cipherWealthContract.getAddress();

  return { cipherWealthContract, cipherWealthContractAddress };
}

describe("CipherWealth on Sepolia", function () {
  let signers: Signers;
  let cipherWealthContract: CipherWealth;
  let cipherWealthContractAddress: string;

  before(async function () {
    // Skip tests if running in mock mode
    if (fhevm.isMock) {
      console.warn(`This test suite is for Sepolia Testnet only`);
      this.skip();
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0] };

    ({ cipherWealthContract, cipherWealthContractAddress } = await getContract());
  });

  it("should have a valid contract address", async function () {
    expect(cipherWealthContractAddress).to.not.eq(ethers.ZeroAddress);
    console.log("CipherWealth contract address:", cipherWealthContractAddress);
  });

  it("should be able to call getBalance", async function () {
    const balance = await cipherWealthContract.connect(signers.deployer).getBalance();
    console.log("Encrypted balance handle:", balance);
    // Balance should be a valid bytes32 value (could be ZeroHash if no deposits yet)
    expect(balance).to.be.properHex(64);
  });

  it("should be able to deposit encrypted amount", async function () {
    // This test requires manual interaction or relayer setup
    // For now, we just verify the function exists and can be called
    const depositAmount = 100;
    const encryptedInput = await fhevm
      .createEncryptedInput(cipherWealthContractAddress, signers.deployer.address)
      .add64(depositAmount)
      .encrypt();

    // Note: This will actually execute on Sepolia if you have funds
    const tx = await cipherWealthContract
      .connect(signers.deployer)
      .deposit(encryptedInput.handles[0], encryptedInput.inputProof);
    
    const receipt = await tx.wait();
    expect(receipt?.status).to.eq(1);
    console.log("Deposit transaction hash:", receipt?.hash);
  });
});
