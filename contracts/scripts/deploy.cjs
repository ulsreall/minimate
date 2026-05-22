const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Celo Alfajores testnet cUSD address
  const CUSD_ALFAJORES = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

  // Deploy MiniMateVault
  console.log("\n1. Deploying MiniMateVault...");
  const Vault = await hre.ethers.getContractFactory("MiniMateVault");
  const vault = await Vault.deploy(CUSD_ALFAJORES);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("   MiniMateVault:", vaultAddr);

  // Deploy MiniMateRouter
  console.log("\n2. Deploying MiniMateRouter...");
  const Router = await hre.ethers.getContractFactory("MiniMateRouter");
  const router = await Router.deploy(CUSD_ALFAJORES);
  await router.waitForDeployment();
  const routerAddr = await router.getAddress();
  console.log("   MiniMateRouter:", routerAddr);

  // Verify on Celoscan
  console.log("\n--- Deployment Summary ---");
  console.log("MiniMateVault:", vaultAddr);
  console.log("MiniMateRouter:", routerAddr);
  console.log("Network: Alfajores (Celo Testnet)");
  console.log("cUSD:", CUSD_ALFAJORES);

  // Save addresses
  const fs = require("fs");
  const addresses = {
    network: "alfajores",
    chainId: 44787,
    MiniMateVault: vaultAddr,
    MiniMateRouter: routerAddr,
    cUSD: CUSD_ALFAJORES,
  };
  fs.writeFileSync(
    "../frontend/src/contracts.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log("\nAddresses saved to frontend/src/contracts.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
