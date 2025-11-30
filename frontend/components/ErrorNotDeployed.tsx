export function errorNotDeployed(chainId: number | undefined) {
  const getNetworkName = (id: number | undefined) => {
    if (id === 11155111) return "Sepolia";
    if (id === 31337) return "Localhost (Hardhat)";
    return id ? `Chain ${id}` : "Unknown Network";
  };

  const isSepolia = chainId === 11155111;
  const isLocalhost = chainId === 31337;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <span className="text-2xl">🔗</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Contract Not Deployed</h2>
            <p className="text-sm text-muted-foreground">
              {getNetworkName(chainId)} • Chain ID: {chainId ?? "undefined"}
            </p>
          </div>
        </div>

        <div className="space-y-4 text-muted-foreground">
          {isSepolia ? (
            <>
              <p>
                The contract has not been deployed to <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">Sepolia</span> yet,
                or the contract address is not configured.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="font-medium text-foreground">Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Run <code className="bg-muted px-1 rounded">npx hardhat deploy --network sepolia</code></li>
                  <li>Run <code className="bg-muted px-1 rounded">cd frontend && node scripts/genabi-cipher.mjs</code> to update addresses</li>
                  <li>Restart the frontend dev server</li>
                </ol>
              </div>
            </>
          ) : isLocalhost ? (
            <>
              <p>
                Please deploy the contract to <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">Localhost (31337)</span> network.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="font-medium text-foreground">Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Run <code className="bg-muted px-1 rounded">npx hardhat node</code> to start local node</li>
                  <li>Run <code className="bg-muted px-1 rounded">npx hardhat deploy --network localhost</code></li>
                  <li>Run <code className="bg-muted px-1 rounded">cd frontend && node scripts/genabi-cipher.mjs</code> to update addresses</li>
                </ol>
              </div>
            </>
          ) : (
            <>
              <p>
                This network is not supported. Please switch to <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">Sepolia (11155111)</span> or <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">Localhost (31337)</span>.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
