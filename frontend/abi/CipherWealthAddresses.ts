/*
  Contract address configuration for CipherWealth.
  
  Addresses are resolved dynamically from environment variables:
  - NEXT_PUBLIC_CIPHER_WEALTH_ADDRESS_31337 (localhost/hardhat)
  - NEXT_PUBLIC_CIPHER_WEALTH_ADDRESS_11155111 (Sepolia)
  - NEXT_PUBLIC_CIPHER_WEALTH_ADDRESS (fallback for any chain)
  
  Fallback defaults are provided for localhost development.
*/

type Address = `0x${string}`;

// Default addresses (used when env vars are not set)
const DEFAULT_LOCALHOST_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

/**
 * Get CipherWealth contract address for the given chainId.
 * Reads from environment variables with fallback to defaults.
 */
export function getCipherWealthAddress(chainId?: number): Address | undefined {
  if (chainId === 31337) {
    // Localhost / Hardhat
    return (process.env.NEXT_PUBLIC_CIPHER_WEALTH_ADDRESS_31337 ||
      process.env.NEXT_PUBLIC_CIPHER_WEALTH_ADDRESS ||
      DEFAULT_LOCALHOST_ADDRESS) as Address;
  }
  if (chainId === 11155111) {
    // Sepolia - no default, must be configured via env var
    return process.env.NEXT_PUBLIC_CIPHER_WEALTH_ADDRESS_11155111 as Address | undefined;
  }
  // Fallback for other chains
  return process.env.NEXT_PUBLIC_CIPHER_WEALTH_ADDRESS as Address | undefined;
}

/**
 * Legacy address map for backward compatibility.
 * Prefer using getCipherWealthAddress() for dynamic resolution.
 */
export const CipherWealthAddresses = { 
  "11155111": { 
    address: process.env.NEXT_PUBLIC_CIPHER_WEALTH_ADDRESS_11155111 || "0x0000000000000000000000000000000000000000", 
    chainId: 11155111, 
    chainName: "sepolia" 
  },
  "31337": { 
    address: process.env.NEXT_PUBLIC_CIPHER_WEALTH_ADDRESS_31337 || DEFAULT_LOCALHOST_ADDRESS, 
    chainId: 31337, 
    chainName: "hardhat" 
  },
};
