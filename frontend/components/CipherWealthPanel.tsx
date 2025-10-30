"use client";

import { useState } from "react";
import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useCipherWealth } from "@/hooks/useCipherWealth";
import { errorNotDeployed } from "./ErrorNotDeployed";
import { Wallet, Lock, Unlock, RefreshCw, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

export const CipherWealthPanel = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const [depositAmount, setDepositAmount] = useState<string>("100");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("50");

  // FHEVM instance
  const {
    instance: fhevmInstance,
    status: fhevmStatus,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  // CipherWealth contract hook
  const cipherWealth = useCipherWealth({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const buttonClass =
    "px-4 py-2 rounded-lg font-semibold transition-all duration-200 " +
    "bg-primary text-primary-foreground hover:bg-primary/90 " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground " +
    "focus:outline-none focus:ring-2 focus:ring-ring";

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <Wallet className="w-16 h-16 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Cipher Wealth</h2>
          <p className="text-muted-foreground mb-6">Connect your wallet to manage your encrypted wealth</p>
          <button className={buttonClass} onClick={connect}>
            Connect Wallet
          </button>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
            <Lock className="h-4 w-4" />
            <span>Your data is encrypted and private</span>
          </div>
        </div>
      </div>
    );
  }

  if (cipherWealth.isDeployed === false) {
    return errorNotDeployed(chainId);
  }

  return (
    <div className="grid w-full gap-6">

      {/* Balance Display */}
      <div className="col-span-full bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-muted-foreground flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Your Balance
          </h2>
          <button
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 flex items-center gap-2"
            disabled={!cipherWealth.canGetBalance}
            onClick={cipherWealth.refreshBalance}
          >
            <RefreshCw className={`w-4 h-4 ${cipherWealth.isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-4xl font-bold text-foreground">
            {cipherWealth.isDecrypted ? cipherWealth.clear?.toString() || "0" : "••••••••"}
          </p>
          <p className="text-sm text-muted-foreground">Encrypted Balance Handle:</p>
          <p className="font-mono text-xs break-all text-muted-foreground">
            {cipherWealth.balance || "Not fetched yet"}
          </p>
        </div>

        <button
          className={`${buttonClass} w-full flex items-center justify-center gap-2`}
          disabled={!cipherWealth.canDecrypt}
          onClick={cipherWealth.decryptBalance}
        >
          {cipherWealth.isDecrypting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Decrypting...
            </>
          ) : cipherWealth.isDecrypted ? (
            <>
              <Unlock className="w-4 h-4" />
              Balance Decrypted
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Decrypt Balance
            </>
          )}
        </button>
      </div>

      {/* Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deposit */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5" />
            Deposit
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Amount</label>
              <input
                type="number"
                className={inputClass}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
              />
            </div>
            <button
              className={`${buttonClass} w-full flex items-center justify-center gap-2`}
              disabled={!cipherWealth.canOperate || !depositAmount || Number(depositAmount) <= 0}
              onClick={() => cipherWealth.deposit(Number(depositAmount))}
            >
              {cipherWealth.isOperating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="w-4 h-4" />
                  Deposit {depositAmount}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Withdraw */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <ArrowUpFromLine className="w-5 h-5" />
            Withdraw
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Amount</label>
              <input
                type="number"
                className={inputClass}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
              />
            </div>
            <button
              className={`${buttonClass} w-full flex items-center justify-center gap-2`}
              disabled={!cipherWealth.canOperate || !withdrawAmount || Number(withdrawAmount) <= 0}
              onClick={() => cipherWealth.withdraw(Number(withdrawAmount))}
            >
              {cipherWealth.isOperating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowUpFromLine className="w-4 h-4" />
                  Withdraw {withdrawAmount}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {cipherWealth.message && (
        <div className="col-span-full bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-foreground font-mono">{cipherWealth.message}</p>
        </div>
      )}

      {/* Contract Info */}
      <div className="col-span-full bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Contract Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Chain ID</p>
            <p className="font-mono font-semibold text-foreground">{chainId}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Contract Address</p>
            <p className="font-mono text-xs break-all text-foreground">{cipherWealth.contractAddress}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Your Address</p>
            <p className="font-mono text-xs break-all text-foreground">{accounts?.[0] || "N/A"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">FHEVM Status</p>
            <p className="font-semibold text-foreground">{fhevmStatus}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
