const hre = require("hardhat");

async function main() {
  const investmentAddress = "0xe330468a982B4d8e92fE3D106517d97bdf67D6Cb";
  const [deployer] = await hre.ethers.getSigners();

  console.log("\n" + "=".repeat(70));
  console.log("🔓 SUNCHAIN - ACTIVATE ALL PROJECTS");
  console.log("=".repeat(70));
  console.log("👤 Admin:", deployer.address);
  console.log("📍 Contract:", investmentAddress);

  const investment = await hre.ethers.getContractAt("SunChainInvestment", investmentAddress);

  // Kiểm tra owner
  try {
    const owner = await investment.owner();
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("❌ ERROR: You are not the owner!");
      return;
    }
    console.log("✅ Owner verified");
  } catch (e) {
    console.log("⚠️  Could not verify owner");
  }

  // Lấy tổng số projects
  const projectCount = await investment.projectCount();
  console.log(`📊 Total projects: ${projectCount}\n`);

  let activatedCount = 0;
  let alreadyActiveCount = 0;
  let failedCount = 0;

  // Duyệt qua tất cả projects
  for (let i = 1; i <= projectCount; i++) {
    console.log("─".repeat(70));

    try {
      const project = await investment.getProject(i);

      console.log(`\n📋 Project #${i}: ${project.name}`);
      console.log(`   Status: ${project.isActive ? '✅ ACTIVE' : '❌ INACTIVE'}`);

      if (!project.isActive) {
        console.log(`   ⏳ Activating...`);

        try {
          const tx = await investment.activateProject(i, {
            gasLimit: 150000
          });

          console.log(`   📝 TX: ${tx.hash}`);
          const receipt = await tx.wait();
          console.log(`   ✅ Activated in block ${receipt.blockNumber}`);

          activatedCount++;

          // Đợi 2 giây giữa mỗi transaction
          if (i < projectCount) {
            await new Promise(r => setTimeout(r, 2000));
          }

        } catch (activateError) {
          console.log(`   ❌ Activation failed: ${activateError.message}`);

          // Có thể contract không có hàm activateProject
          if (activateError.message.includes("activateProject is not a function")) {
            console.log(`   ⚠️  Contract doesn't have activateProject() function`);
            console.log(`   💡 Projects might be auto-active or need manual activation in contract`);
            break; // Dừng vòng lặp vì không có hàm này
          }

          failedCount++;
        }
      } else {
        console.log(`   ⏭️  Already active, skipping`);
        alreadyActiveCount++;
      }

    } catch (error) {
      console.log(`   ❌ Error loading project: ${error.message}`);
      failedCount++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 ACTIVATION SUMMARY");
  console.log("=".repeat(70));
  console.log(`📈 Total projects: ${projectCount}`);
  console.log(`✅ Newly activated: ${activatedCount}`);
  console.log(`⏭️  Already active: ${alreadyActiveCount}`);
  console.log(`❌ Failed: ${failedCount}`);

  // Verify tất cả projects
  console.log("\n" + "=".repeat(70));
  console.log("🔍 FINAL VERIFICATION");
  console.log("=".repeat(70));

  let activeCount = 0;
  let inactiveCount = 0;

  for (let i = 1; i <= projectCount; i++) {
    try {
      const project = await investment.getProject(i);
      const icon = project.isActive ? '✅' : '❌';

      console.log(`${icon} #${i}: ${project.name}`);

      if (project.isActive) {
        activeCount++;
      } else {
        inactiveCount++;
      }
    } catch (e) {
      console.log(`❌ #${i}: Error loading`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log(`✅ Active projects: ${activeCount}/${projectCount}`);
  console.log(`❌ Inactive projects: ${inactiveCount}/${projectCount}`);

  if (inactiveCount > 0) {
    console.log("\n⚠️  WARNING: Some projects are still INACTIVE!");
    console.log("💡 Users cannot invest in inactive projects.");
    console.log("💡 You may need to manually activate them in the smart contract.");
  } else {
    console.log("\n🎉 SUCCESS! All projects are now ACTIVE!");
    console.log("✅ Users can now invest in any project!");
  }

  console.log("=".repeat(70));
  console.log("\n✨ Done!\n");
}

main().catch((error) => {
  console.error("\n💥 ERROR:", error);
  process.exitCode = 1;
});