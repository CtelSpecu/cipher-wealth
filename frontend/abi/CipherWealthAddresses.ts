/*
  Contract address configuration for CipherWealth.
  
  Default addresses are hardcoded for production builds.
  Can be overridden via environment variables:
  - NEXT_PUBLIC_CIPHER_WEALTH_ADDRESS_31337 (localhost/hardhat)
  - NEXT_PUBLIC_CIPHER_WEALTH_ADDRESS_11155111 (Sepolia)
*/

type Address = `0x${string}`;

// Default addresses - update these after deployment
const DEFAULT_LOCALHOST_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const DEFAULT_SEPOLIA_ADDRESS = "0xF8f4c762F7C23c069A08b504D9764cFD0A3b9502";

/**
 * Get CipherWealth contract address for the given chainId.
 * Uses hardcoded defaults with optional env var override.
 */
export function getCipherWealthAddress(chainId?: number): Address | undefined {
  if (chainId === 31337) {
    return (process.env.NEXT_PUBLIC_CIPHER_WEALTH_ADDRESS_31337 ||
      DEFAULT_LOCALHOST_ADDRESS) as Address;
  }
  if (chainId === 11155111) {
    return (process.env.NEXT_PUBLIC_CIPHER_WEALTH_ADDRESS_11155111 ||
      DEFAULT_SEPOLIA_ADDRESS) as Address;
  }
  return undefined;
}

/**
 * Static address map for direct lookup.
 */
export const CipherWealthAddresses = { 
  "11155111": { 
    address: DEFAULT_SEPOLIA_ADDRESS, 
    chainId: 11155111, 
    chainName: "sepolia" 
  },
  "31337": { 
    address: DEFAULT_LOCALHOST_ADDRESS, 
    chainId: 31337, 
    chainName: "hardhat" 
  },
};
