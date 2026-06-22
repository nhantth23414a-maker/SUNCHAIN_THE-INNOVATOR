const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("👤 Account:", deployer.address);

  // Check SepoliaETH balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 SepoliaETH:", hre.ethers.formatEther(balance), "ETH");

  // Check if contracts are deployed
  const usdtAddress = "0xF81C9ED5A3635A0D9178845f39D92e40825E7EfE";
  const solarAddress = "0x6Efe2857b76A85386324E201f8BDCaCeA1269822";

  try {
    const usdt = await hre.ethers.getContractAt("MockUSDT", usdtAddress);
    const usdtBalance = await usdt.balanceOf(deployer.address);
    console.log("💵 USDT:", hre.ethers.formatUnits(usdtBalance, 6), "USDT");
  } catch (e) {
    console.log("💵 USDT: Not checked (contract may not exist)");
  }

  try {
    const solar = await hre.ethers.getContractAt("SolarToken", solarAddress);
    const solarBalance = await solar.balanceOf(deployer.address);
    console.log("☀️ SOLAR:", hre.ethers.formatEther(solarBalance), "SOLAR");
  } catch (e) {
    console.log("☀️ SOLAR: Not checked (contract may not exist)");
  }

  console.log("\n📋 Deployed Contracts:");
  console.log("USDT:", usdtAddress);
  console.log("SOLAR:", solarAddress);
  console.log("Investment:", "0xe122315A4A05b87ad62Ab0a0c6170a9FAA672909");
  console.log("Oracle:", "0x2eCCd4e822DD1FB4c85E7f6Bb28488CBA2792988");

  if (balance < hre.ethers.parseEther("0.01")) {
    console.log("\n⚠️ WARNING: Low balance! Get more SepoliaETH from:");
    console.log("🚰 https://www.alchemy.com/faucets/ethereum-sepolia");
  } else {
    console.log("\n✅ Balance sufficient");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});