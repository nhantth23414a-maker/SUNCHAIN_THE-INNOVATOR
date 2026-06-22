const hre = require("hardhat");

async function main() {
  const investmentAddress = "...";

  // Lấy địa chỉ từ argument hoặc dùng deployer
  const walletToApprove = process.argv[2] || (await hre.ethers.getSigners())[0].address;

  console.log("🔑 Approving KYC for:", walletToApprove);

  const investment = await hre.ethers.getContractAt("SunChainInvestment", investmentAddress);

  const tx = await investment.approveKYC(walletToApprove);
  await tx.wait();

  console.log("✅ KYC approved! TX:", tx.hash);
  console.log("🔗 View on Etherscan:", `https://sepolia.etherscan.io/tx/${tx.hash}`);

  // Verify
  const isApproved = await investment.kycApproved(walletToApprove);
  console.log("✅ KYC Status:", isApproved);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});