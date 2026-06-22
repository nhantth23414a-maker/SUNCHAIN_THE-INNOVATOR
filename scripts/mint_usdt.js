const hre = require("hardhat");

async function main() {
  const usdtAddress = "0xF81C9ED5A3635A0D9178845f39D92e40825E7EfE";
  const [deployer] = await hre.ethers.getSigners();

  console.log("💰 Minting USDT for:", deployer.address);

  const usdt = await hre.ethers.getContractAt("MockUSDT", usdtAddress);

  // Mint 10,000 USDT (6 decimals)
  // Dùng cách tính thủ công thay vì parseUnits
  const amount = 10000n * 10n**6n; // 10000 USDT = 10,000,000,000 (10^6 decimals)

  const tx = await usdt.mint(deployer.address, amount);
  await tx.wait();

  console.log("✅ Minted 10,000 USDT! TX:", tx.hash);

  // Check balance
  const balance = await usdt.balanceOf(deployer.address);
  // Format manually: chia cho 10^6 và chia 1000000
  const balanceFormatted = Number(balance) / 1000000;
  console.log("💵 Your USDT balance:", balanceFormatted, "USDT");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});