const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing SunChain Investment Flow on Sepolia\n");

  const [deployer] = await hre.ethers.getSigners();

  const contracts = {
    usdt: "0xF81C9ED5A3635A0D9178845f39D92e40825E7EfE",
    solar: "0x6Efe2857b76A85386324E201f8BDCaCeA1269822",
    investment: "0xe122315A4A05b87ad62Ab0a0c6170a9FAA672909"
  };

  console.log("📋 Investor:", deployer.address);
  console.log("🌐 Network: Sepolia Testnet\n");

  // Load contracts
  const usdt = await hre.ethers.getContractAt("MockUSDT", contracts.usdt);
  const solar = await hre.ethers.getContractAt("SolarToken", contracts.solar);
  const investment = await hre.ethers.getContractAt("SunChainInvestment", contracts.investment);

  console.log("=".repeat(60));
  console.log("STEP 1: Check USDT Balance");
  console.log("=".repeat(60));
  let usdtBalance = await usdt.balanceOf(deployer.address);
  console.log("💵 Current USDT:", hre.ethers.formatUnits(usdtBalance, 6), "USDT");

  if (usdtBalance === 0n) {
    console.log("⚠️ No USDT found. Minting 10,000 USDT...");
    const mintTx = await usdt.mint(deployer.address, hre.ethers.parseUnits("10000", 6));
    await mintTx.wait();
    usdtBalance = await usdt.balanceOf(deployer.address);
    console.log("✅ Minted! New balance:", hre.ethers.formatUnits(usdtBalance, 6), "USDT");
  }
  console.log();

  console.log("=".repeat(60));
  console.log("STEP 2: Check KYC Status");
  console.log("=".repeat(60));
  let isKYC = await investment.kycApproved(deployer.address);
  console.log("🎫 KYC approved:", isKYC);

  if (!isKYC) {
    console.log("⚠️ KYC not approved. Approving...");
    const kycTx = await investment.approveKYC(deployer.address);
    await kycTx.wait();
    isKYC = await investment.kycApproved(deployer.address);
    console.log("✅ KYC approved:", isKYC);
  }
  console.log();

  console.log("=".repeat(60));
  console.log("STEP 3: Check Project Status");
  console.log("=".repeat(60));
  const projectCount = await investment.projectCount();
  console.log("📊 Total projects:", projectCount.toString());

  if (projectCount === 0n) {
    console.log("⚠️ No projects found. Creating one...");
    const createTx = await investment.createProject(
      "Test Solar Farm",
      1000,
      18,
      100,
      365,
      deployer.address
    );
    await createTx.wait();
    console.log("✅ Project created!");
  }

  const project = await investment.getProject(1);
  console.log("\n📋 Project #1:");
  console.log("   Name:", project.name);
  console.log("   Target:", hre.ethers.formatUnits(project.targetAmount, 6), "USDT");
  console.log("   Raised:", hre.ethers.formatUnits(project.raisedAmount, 6), "USDT");
  console.log("   APY:", project.apy.toString(), "%");
  console.log("   Active:", project.isActive);
  console.log();

  console.log("=".repeat(60));
  console.log("STEP 4: Approve USDT for Investment Contract");
  console.log("=".repeat(60));
  const investAmount = hre.ethers.parseUnits("100", 6);
  console.log("💰 Approving", hre.ethers.formatUnits(investAmount, 6), "USDT...");
  const approveTx = await usdt.approve(contracts.investment, investAmount);
  await approveTx.wait();
  console.log("✅ USDT approved!");
  console.log();

  console.log("=".repeat(60));
  console.log("STEP 5: Make Investment");
  console.log("=".repeat(60));
  console.log("🚀 Investing", hre.ethers.formatUnits(investAmount, 6), "USDT into Project #1...");
  const investTx = await investment.invest(1, investAmount);
  const receipt = await investTx.wait();
  console.log("✅ Investment successful!");
  console.log("📝 TX Hash:", receipt.hash);
  console.log("🔗 View on Etherscan:", `https://sepolia.etherscan.io/tx/${receipt.hash}`);
  console.log();

  console.log("=".repeat(60));
  console.log("STEP 6: Check SOLAR Token Balance");
  console.log("=".repeat(60));
  const solarBalance = await solar.balanceOf(deployer.address);
  console.log("☀️ SOLAR tokens received:", hre.ethers.formatEther(solarBalance), "SOLAR");
  console.log();

  console.log("=".repeat(60));
  console.log("STEP 7: Final Project Status");
  console.log("=".repeat(60));
  const updatedProject = await investment.getProject(1);
  const progress = (Number(updatedProject.raisedAmount) * 100 / Number(updatedProject.targetAmount)).toFixed(2);
  console.log("📊 Project Progress:", progress + "%");
  console.log("💰 Total Raised:", hre.ethers.formatUnits(updatedProject.raisedAmount, 6), "USDT");
  console.log();

  console.log("=".repeat(60));
  console.log("🎉 TEST COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log("\n✅ All steps passed!");
  console.log("✅ Investment flow working correctly");
  console.log("✅ Ready for frontend integration");
}

main().catch((error) => {
  console.error("\n❌ Error:", error);
  process.exitCode = 1;
});