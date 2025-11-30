import { useCallback, useEffect, useMemo, useRef, useState, RefObject } from "react";
import type { FhevmInstance } from "../fhevm/fhevmTypes";
import type { Eip1193Provider, JsonRpcSigner, ContractRunner } from "ethers";
import { Contract, ethers } from "ethers";
import { CipherWealth } from "../abi/CipherWealth";
import { getCipherWealthAddress } from "../abi/CipherWealthAddresses";
import type { GenericStringStorage } from "../fhevm/GenericStringStorage";
import { FhevmDecryptionSignature } from "../fhevm/FhevmDecryptionSignature";

type CipherWealthInfoType = {
  abi: typeof CipherWealth.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getChainName(chainId: number): string {
  if (chainId === 31337) return "hardhat";
  if (chainId === 11155111) return "sepolia";
  return `chain-${chainId}`;
}

function getCipherWealthByChainId(chainId: number | undefined): CipherWealthInfoType {
  if (!chainId) {
    return { abi: CipherWealth.abi };
  }

  // Use dynamic address resolution from environment variables
  const address = getCipherWealthAddress(chainId);

  if (!address || address === ethers.ZeroAddress) {
    return { abi: CipherWealth.abi, chainId };
  }

  return {
    address,
    chainId,
    chainName: getChainName(chainId),
    abi: CipherWealth.abi,
  };
}

type UseCipherWealthParams = {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: JsonRpcSigner | undefined;
  ethersReadonlyProvider: ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<(ethersSigner: JsonRpcSigner | undefined) => boolean>;
};

export function useCipherWealth({
  instance,
  fhevmDecryptionSignatureStorage,
  eip1193Provider,
  chainId,
  ethersSigner,
  ethersReadonlyProvider,
  sameChain,
  sameSigner,
}: UseCipherWealthParams) {
  const [balance, setBalance] = useState<string | null>(null);
  const [clear, setClear] = useState<bigint | null>(null);
  const [isDecrypted, setIsDecrypted] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [isOperating, setIsOperating] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const cipherWealthRef = useRef<CipherWealthInfoType | undefined>(undefined);

  const cipherWealth = useMemo(() => {
    const info = getCipherWealthByChainId(chainId);
    cipherWealthRef.current = info;
    // Clear message - don't show deployment errors in the UI
    setMessage("");
    return info;
  }, [chainId]);

  const isDeployed = useMemo(() => {
    if (!cipherWealth) return null;
    // Return null if chainId is not yet known (wallet not connected)
    if (!chainId) return null;
    return Boolean(cipherWealth.address) && cipherWealth.address !== ethers.ZeroAddress;
  }, [cipherWealth, chainId]);

  const canGetBalance = Boolean(
    instance &&
      cipherWealth.address &&
      ethersReadonlyProvider &&
      ethersSigner &&
      sameChain.current(chainId) &&
      sameSigner.current(ethersSigner) &&
      !isRefreshing,
  );

  const canDecrypt = Boolean(
    instance &&
      cipherWealth.address &&
      balance &&
      balance !== "0x0000000000000000000000000000000000000000000000000000000000000000" &&
      eip1193Provider &&
      ethersSigner &&
      sameChain.current(chainId) &&
      sameSigner.current(ethersSigner) &&
      !isDecrypting &&
      !isDecrypted,
  );

  const canOperate = Boolean(
    instance && cipherWealth.address && eip1193Provider && ethersSigner && sameChain.current(chainId) && sameSigner.current(ethersSigner) && !isOperating,
  );

  // Refresh balance handle
  const refreshBalance = useCallback(async () => {
    if (!canGetBalance || !cipherWealth.address || !ethersSigner) return;

    setIsRefreshing(true);
    setMessage("Fetching encrypted balance...");

    try {
      const userAddress = await ethersSigner.getAddress();
      const contract = new Contract(cipherWealth.address, cipherWealth.abi, ethersReadonlyProvider!);
      const balanceHandle = await contract.getBalance({ from: userAddress });
      setBalance(balanceHandle);
      setIsDecrypted(false);
      setClear(null);
      setMessage("Balance handle retrieved successfully");
    } catch (error: any) {
      console.error("Failed to get balance:", error);
      setMessage(`Error: ${error.message || "Failed to get balance"}`);
    } finally {
      setIsRefreshing(false);
    }
  }, [canGetBalance, cipherWealth.address, cipherWealth.abi, ethersReadonlyProvider, ethersSigner]);

  // Decrypt balance
  const decryptBalance = useCallback(async () => {
    if (!canDecrypt || !cipherWealth.address || !instance || !ethersSigner) return;

    setIsDecrypting(true);
    setMessage("Decrypting balance...");

    try {
      const contractAddress = cipherWealth.address as `0x${string}`;

      const sig = await FhevmDecryptionSignature.loadOrSign(
        instance,
        [contractAddress],
        ethersSigner,
        fhevmDecryptionSignatureStorage,
      );

      if (!sig) {
        setMessage("Unable to build FHEVM decryption signature");
        return;
      }

      const res = await instance.userDecrypt(
        [{ handle: balance!, contractAddress }],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays,
      );

      const clearValue = res[balance!];
      const bigintValue = typeof clearValue === "bigint" ? clearValue : BigInt(clearValue);
      setClear(bigintValue);
      setIsDecrypted(true);
      setMessage(`Decrypted balance: ${bigintValue.toString()}`);
    } catch (error: any) {
      console.error("Failed to decrypt balance:", error);
      setMessage(`Decryption error: ${error.message || "Failed to decrypt"}`);
    } finally {
      setIsDecrypting(false);
    }
  }, [canDecrypt, cipherWealth.address, instance, balance, ethersSigner, fhevmDecryptionSignatureStorage]);

  // Deposit encrypted amount
  const deposit = useCallback(
    async (amount: number) => {
      if (!canOperate || !cipherWealth.address) return;

      setIsOperating(true);
      setMessage(`Depositing ${amount}...`);

      try {
        const userAddress = await ethersSigner!.getAddress();
        const contractAddress = cipherWealth.address as string;
        const encryptedInput = await instance!.createEncryptedInput(contractAddress, userAddress);
        encryptedInput.add64(amount);
        const { handles, inputProof } = await encryptedInput.encrypt();

        const contract = new Contract(contractAddress, cipherWealth.abi, ethersSigner!);
        const tx = await contract.deposit(handles[0], inputProof);
        await tx.wait();

        setMessage(`Successfully deposited ${amount}`);
        setIsDecrypted(false);
        setClear(null);

        // Auto-refresh balance after deposit
        setTimeout(() => refreshBalance(), 1000);
      } catch (error: any) {
        console.error("Failed to deposit:", error);
        setMessage(`Deposit error: ${error.message || "Failed to deposit"}`);
      } finally {
        setIsOperating(false);
      }
    },
    [canOperate, instance, cipherWealth.address, cipherWealth.abi, ethersSigner, refreshBalance],
  );

  // Withdraw encrypted amount
  const withdraw = useCallback(
    async (amount: number) => {
      if (!canOperate) return;

      setIsOperating(true);
      setMessage(`Withdrawing ${amount}...`);

      try {
        const userAddress = await ethersSigner!.getAddress();
        const contractAddress = cipherWealth.address as string;
        const encryptedInput = await instance!.createEncryptedInput(contractAddress, userAddress);
        encryptedInput.add64(amount);
        const { handles, inputProof } = await encryptedInput.encrypt();

        const contract = new Contract(contractAddress, cipherWealth.abi, ethersSigner!);
        const tx = await contract.withdraw(handles[0], inputProof);
        await tx.wait();

        setMessage(`Successfully withdrew ${amount}`);
        setIsDecrypted(false);
        setClear(null);

        // Auto-refresh balance after withdrawal
        setTimeout(() => refreshBalance(), 1000);
      } catch (error: any) {
        console.error("Failed to withdraw:", error);
        setMessage(`Withdrawal error: ${error.message || "Failed to withdraw"}`);
      } finally {
        setIsOperating(false);
      }
    },
    [canOperate, instance, cipherWealth.address, cipherWealth.abi, ethersSigner, refreshBalance],
  );

  return {
    contractAddress: cipherWealth.address || null,
    isDeployed,
    balance,
    clear,
    isDecrypted,
    isRefreshing,
    isDecrypting,
    isOperating,
    canGetBalance,
    canDecrypt,
    canOperate,
    message,
    refreshBalance,
    decryptBalance,
    deposit,
    withdraw,
  };
}
