const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Celo Mainnet stablecoin addresses
  const CUSD_MAINNET = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
  const CUSD = CUSD_MAINNET;

  // Deploy MiniMateVault
  console.log("\n1. Deploying MiniMateVault...");
  const Vault = await hre.ethers.getContractFactory("MiniMateVault");
  const vault = await Vault.deploy(CUSD);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("   MiniMateVault:", vaultAddr);

  // Deploy MiniMateRouter
  console.log("\n2. Deploying MiniMateRouter...");
  const Router = await hre.ethers.getContractFactory("MiniMateRouter");
  const router = await Router.deploy(CUSD);
  await router.waitForDeployment();
  const routerAddr = await router.getAddress();
  console.log("   MiniMateRouter:", routerAddr);

  // Verify on Celoscan
  console.log("\n--- Deployment Summary ---");
  console.log("MiniMateVault:", vaultAddr);
  console.log("MiniMateRouter:", routerAddr);
  console.log("Network: Celo Mainnet (42220)");
  console.log("cUSD:", CUSD);

  // Save addresses
  const fs = require("fs");
  const addresses = {
    network: "celo",
    chainId: 42220,
    MiniMateVault: vaultAddr,
    MiniMateRouter: routerAddr,
    cUSD: CUSD,
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
