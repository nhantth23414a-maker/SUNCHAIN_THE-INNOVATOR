const hre = require("hardhat");

async function main() {
  const investmentAddress = "0xe122315A4A05b87ad62Ab0a0c6170a9FAA672909";
  const [deployer] = await hre.ethers.getSigners();

  console.log("🏗️  TẠO PROJECT MỚI VỚI TARGET HỢP LÝ");
  console.log("=".repeat(70));
  console.log("👤 Owner:", deployer.address);

  const investment = await hre.ethers.getContractAt("SunChainInvestment", investmentAddress);

  // Kiểm tra owner
  try {
    const owner = await investment.owner();
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("❌ BẠN KHÔNG PHẢI OWNER!");
      console.log("   Contract owner:", owner);
      console.log("   Your address:", deployer.address);
      console.log("\n💡 Chỉ owner mới có thể tạo project.");
      console.log("💡 Hãy dùng wallet đã deploy contract.");
      return;
    }
    console.log("✅ Owner verified");
  } catch (e) {
    console.log("⚠️  Không thể verify owner:", e.message);
  }

  // Thông tin project mới - TARGET LỚN HƠN NHIỀU
  const newProject = {
    name: "Solar Farm Bình Dương 2025",
    targetAmount: hre.ethers.parseUnits("500000", 6), // 500,000 USDT (target lớn)
    apy: 18, // 18% APY
    minInvestment: hre.ethers.parseUnits("10", 6), // Min 10 USDT
    duration: 365, // 365 ngày
    beneficiary: deployer.address
  };

  console.log("\n📋 Project Details:");
  console.log("   Name:", newProject.name);
  console.log("   Target:", hre.ethers.formatUnits(newProject.targetAmount, 6), "USDT");
  console.log("   APY:", newProject.apy + "%");
  console.log("   Min Investment:", hre.ethers.formatUnits(newProject.minInvestment, 6), "USDT");
  console.log("   Duration:", newProject.duration, "days");
  console.log("   Beneficiary:", newProject.beneficiary);

  console.log("\n⏳ Creating project...");

  try {
    const tx = await investment.createProject(
      newProject.name,
      newProject.targetAmount,
      newProject.apy,
      newProject.minInvestment,
      newProject.duration,
      newProject.beneficiary,
      {
        gasLimit: 500000
      }
    );

    console.log("📤 TX Hash:", tx.hash);
    console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/tx/${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Project created! Block:", receipt.blockNumber);

    // Lấy project ID mới
    const projectCount = await investment.projectCount();
    const newProjectId = projectCount;

    console.log("\n" + "=".repeat(70));
    console.log("✅ PROJECT CREATED SUCCESSFULLY!");
    console.log("=".repeat(70));
    console.log("📊 New Project ID:", newProjectId.toString());

    // Verify project
    const project = await investment.getProject(newProjectId);
    console.log("\n📋 Verification:");
    console.log("   Name:", project.name);
    console.log("   Target:", hre.ethers.formatUnits(project.targetAmount, 6), "USDT");
    console.log("   Raised:", hre.ethers.formatUnits(project.raisedAmount, 6), "USDT");
    console.log("   Active:", project.isActive);
    console.log("   APY:", project.apy.toString() + "%");
    console.log("   Available space:", hre.ethers.formatUnits(project.targetAmount, 6), "USDT");

    // Try to activate nếu chưa active
    if (!project.isActive) {
      console.log("\n⚠️  Project chưa active. Đang activate...");
      try {
        const activateTx = await investment.activateProject(newProjectId, {
          gasLimit: 200000
        });
        await activateTx.wait();
        console.log("✅ Project activated!");
      } catch (e) {
        console.log("⚠️  Activate failed:", e.message);
        console.log("💡 Project có thể đã tự động active hoặc không có function activateProject()");
      }
    }

    console.log("\n" + "=".repeat(70));
    console.log("🎉 HOÀN TẤT!");
    console.log("=".repeat(70));
    console.log("\n📝 BÂY GIỜ BẠN CÓ THỂ ĐẦU TƯ:");
    console.log("\n1️⃣  Cách 1: Đầu tư qua script");
    console.log(`   Sửa projectId = ${newProjectId} trong file debug_invest_error.js`);
    console.log("   Sau đó chạy: npx hardhat run debug_invest_error.js --network sepolia");
    console.log("\n2️⃣  Cách 2: Test nhanh ngay");
    console.log("   Đang chuẩn bị test invest...\n");

    // Auto test invest
    console.log("=".repeat(70));
    console.log("🧪 AUTO TEST INVESTMENT");
    console.log("=".repeat(70));

    const usdt = await hre.ethers.getContractAt("MockUSDT", "0xF81C9ED5A3635A0D9178845f39D92e40825E7EfE");
    const testAmount = hre.ethers.parseUnits("100", 6); // Test với 100 USDT

    // Check & mint USDT
    let balance = await usdt.balanceOf(deployer.address);
    console.log("💵 USDT Balance:", hre.ethers.formatUnits(balance, 6), "USDT");

    if (balance < testAmount) {
      console.log("⚠️  Minting USDT...");
      const mintTx = await usdt.mint(deployer.address, hre.ethers.parseUnits("10000", 6));
      await mintTx.wait();
      balance = await usdt.balanceOf(deployer.address);
      console.log("✅ New balance:", hre.ethers.formatUnits(balance, 6), "USDT");
    }

    // Check & approve
    let allowance = await usdt.allowance(deployer.address, investmentAddress);
    if (allowance < testAmount) {
      console.log("⚠️  Approving USDT...");
      const approveTx = await usdt.approve(investmentAddress, hre.ethers.parseUnits("1000000", 6));
      await approveTx.wait();
      console.log("✅ USDT approved");
    }

    // Test invest
    console.log(`\n🚀 Testing invest ${hre.ethers.formatUnits(testAmount, 6)} USDT into Project #${newProjectId}...`);

    try {
      const investTx = await investment.invest(newProjectId, testAmount, {
        gasLimit: 500000
      });

      console.log("📤 TX:", investTx.hash);
      await investTx.wait();

      console.log("\n🎉 TEST INVESTMENT SUCCESSFUL!");

      // Check results
      const solar = await hre.ethers.getContractAt("SolarToken", "0x6Efe2857b76A85386324E201f8BDCaCeA1269822");
      const solarBalance = await solar.balanceOf(deployer.address);
      console.log("☀️  SOLAR received:", hre.ethers.formatEther(solarBalance), "SOLAR");

      const updatedProject = await investment.getProject(newProjectId);
      console.log("📊 Project raised:", hre.ethers.formatUnits(updatedProject.raisedAmount, 6), "USDT");

    } catch (e) {
      console.log("\n❌ Test invest failed:", e.message);
      console.log("\n💡 Có thể do:");
      console.log("   1. KYC chưa approve");
      console.log("   2. SolarToken ownership chưa đúng");
      console.log("   3. Lỗi khác trong contract");
      console.log("\n🔧 Hãy chạy: npx hardhat run deep_debug_investment.js --network sepolia");
    }

  } catch (e) {
    console.log("\n❌ TẠO PROJECT THẤT BẠI!");
    console.log("Error:", e.message);

    if (e.message.includes("Ownable") || e.message.includes("caller is not the owner")) {
      console.log("\n⚠️  BẠN KHÔNG PHẢI OWNER!");
      console.log("💡 Chỉ owner mới tạo được project");
      console.log(`💡 Owner address: ${await investment.owner()}`);
      console.log(`💡 Your address: ${deployer.address}`);
    }
  }
}

main().catch((error) => {
  console.error("\n💥 Fatal Error:", error);
  process.exitCode = 1;
});