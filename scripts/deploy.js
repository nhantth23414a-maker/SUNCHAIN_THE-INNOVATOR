const hre = require("hardhat");

async function main() {
  console.log("🚀 Bắt đầu quá trình deploy lên mạng:", hre.network.name);

  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deploying contracts with account:", deployer.address);

  // 1. Deploy MockUSDT (Hoặc dùng địa chỉ USDT thật nếu có)
  // Nếu là mạng local hoặc testnet cần tự mint USDT, ta deploy Mock
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const usdt = await MockUSDT.deploy();
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("✅ MockUSDT deployed to:", usdtAddress);

  // 2. Deploy SolarToken
  const SolarToken = await hre.ethers.getContractFactory("SolarToken");
  const solarToken = await SolarToken.deploy();
  await solarToken.waitForDeployment();
  const solarTokenAddress = await solarToken.getAddress();
  console.log("✅ SolarToken deployed to:", solarTokenAddress);

  // 3. Deploy SunChainInvestment
  // Constructor: (address _usdtToken, address _solarToken)
  const SunChainInvestment = await hre.ethers.getContractFactory("SunChainInvestment");
  const investment = await SunChainInvestment.deploy(usdtAddress, solarTokenAddress);
  await investment.waitForDeployment();
  const investmentAddress = await investment.getAddress();
  console.log("✅ SunChainInvestment deployed to:", investmentAddress);

  // 4. Deploy SolarOracle
  const SolarOracle = await hre.ethers.getContractFactory("SolarOracle");
  const oracle = await SolarOracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("✅ SolarOracle deployed to:", oracleAddress);

  // ================= CẤU HÌNH QUYỀN (CRITICAL STEP) =================

  console.log("\n⚙️  Đang cấu hình quyền hạn (Ownership)...");

  // Quan trọng: Chuyển quyền Owner của SolarToken sang Investment Contract
  // Để Investment Contract có thể gọi hàm mintForInvestment
  try {
    const tx = await solarToken.transferOwnership(investmentAddress);
    await tx.wait();
    console.log("✅ Đã chuyển ownership của SolarToken -> SunChainInvestment");
  } catch (error) {
    console.error("❌ Lỗi chuyển ownership SolarToken:", error);
  }

  // In ra thông tin để copy vào .env
  console.log("\n📋 HÃY COPY CÁC DÒNG SAU VÀO FILE .env CỦA BẠN:");
  console.log("====================================================");
  console.log(`USDT_ADDRESS=${usdtAddress}`);
  console.log(`SOLAR_TOKEN_ADDRESS=${solarTokenAddress}`);
  console.log(`INVESTMENT_CONTRACT=${investmentAddress}`);
  console.log(`ORACLE_CONTRACT=${oracleAddress}`);
  console.log("====================================================");

  // Verify code (chỉ chạy khi không phải localhost)
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\n⏳ Đợi 15s để Etherscan cập nhật index...");
    await new Promise(r => setTimeout(r, 15000));

    try {
      console.log("🔍 Đang verify contracts trên Etherscan...");
      await hre.run("verify:verify", {
        address: usdtAddress,
        constructorArguments: []
      });
      await hre.run("verify:verify", {
        address: solarTokenAddress,
        constructorArguments: []
      });
      await hre.run("verify:verify", {
        address: investmentAddress,
        constructorArguments: [usdtAddress, solarTokenAddress]
      });
      await hre.run("verify:verify", {
        address: oracleAddress,
        constructorArguments: []
      });
      console.log("✅ Đã verify source code thành công");
    } catch (error) {
      console.log("⚠️ Verify lỗi (có thể bỏ qua):", error.message);
    }
  }

  console.log("\n🎉 Deploy hoàn tất!");
}

// Bắt buộc phải có đoạn này để chạy hàm main
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});