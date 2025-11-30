export function errorNotDeployed(chainId: number | undefined) {
  const getNetworkName = (id: number | undefined) => {
    if (id === 11155111) return "Sepolia";
    if (id === 31337) return "Localhost (Hardhat)";
    return id ? `Chain ${id}` : "Unknown Network";
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card border border-destructive/50 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Contract Not Available</h2>
            <p className="text-sm text-muted-foreground">
              {getNetworkName(chainId)} • Chain ID: {chainId ?? "undefined"}
            </p>
          </div>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <p>
            The <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">CipherWealth</span> contract 
            is not deployed on this network, or the deployment address is not configured.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="font-medium text-foreground">To use this app:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Switch to <span className="font-semibold">Localhost (31337)</span> if running a local Hardhat node</li>
              <li>Or deploy the contract to your current network</li>
            </ul>
          </div>

          {chainId === 31337 && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Localhost detected:</span> Make sure your Hardhat node is running 
                and the contract is deployed with <code className="bg-muted px-1 rounded">npx hardhat deploy --network localhost</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
