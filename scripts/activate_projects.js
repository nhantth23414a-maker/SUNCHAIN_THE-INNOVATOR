const hre = require("hardhat");

async function main() {
  const investmentAddress = "";
  const [deployer] = await hre.ethers.getSigners();

  console.log("\n" + "=".repeat(70));
  console.log("🔓 SUNCHAIN - ACTIVATE ALL PROJECTS");
  console.log("=".repeat(70));
  console.log("👤 Admin:", deployer.address);
  console.log("📍 Contract:", investmentAddress);
  console.log("🌐 Network:", hre.network.name);

  const investment = await hre.ethers.getContractAt("SunChainInvestment", investmentAddress);

  // Verify owner
  try {
    const owner = await investment.owner();
    console.log("👑 Owner:", owner);

    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("\n❌ ERROR: You are not the owner!");
      console.log("   Current owner:", owner);
      console.log("   Your address:", deployer.address);
      return;
    }
    console.log("✅ Owner verified");
  } catch (e) {
    console.log("⚠️  Warning: Could not verify owner:", e.message);
  }

  // Get total projects
  const projectCount = await investment.projectCount();
  console.log(`📊 Total projects: ${projectCount}\n`);

  if (projectCount === 0n) {
    console.log("❌ No projects found! Please create projects first.");
    console.log("\nRun: npx hardhat run scripts/create_project.js --network sepolia");
    return;
  }

  // Check if contract has activateProject function
  console.log("🔍 Checking contract interface...");
  let hasActivateFunction = false;

  try {
    // Try to encode the function call - if it fails, function doesn't exist
    investment.interface.getFunction("activateProject");
    hasActivateFunction = true;
    console.log("✅ Contract has activateProject() function");
  } catch (e) {
    console.log("⚠️  Contract DOES NOT have activateProject() function");
  }

  if (!hasActivateFunction) {
    console.log("\n" + "=".repeat(70));
    console.log("⚠️  SOLUTION: Your contract needs to be updated!");
    console.log("=".repeat(70));
    console.log("\nYour contract is missing the activateProject() function.");
    console.log("\n🔧 QUICK FIX OPTIONS:");
    console.log("\n1️⃣  OPTION A: Update your Solidity contract to add:");
    console.log(`
    function activateProject(uint256 projectId) external onlyOwner {
        require(projectId > 0 && projectId <= projectCount, "Invalid project ID");
        projects[projectId].isActive = true;
        emit ProjectActivated(projectId);
    }

    event ProjectActivated(uint256 indexed projectId);
    `);

    console.log("\n2️⃣  OPTION B: Modify createProject() to auto-activate:");
    console.log(`
    function createProject(...) external onlyOwner {
        // ... existing code ...
        project.isActive = true;  // ← ADD THIS LINE
        emit ProjectCreated(projectCount, name, targetAmount);
    }
    `);

    console.log("\n3️⃣  OPTION C: Use this manual activation script:");
    console.log("\nSince you can't modify the deployed contract, I'll try to");
    console.log("activate projects using the contract's existing functions...\n");

    // Fall through to try manual activation
  }

  console.log("=".repeat(70));
  console.log("⏳ ATTEMPTING TO ACTIVATE PROJECTS...");
  console.log("=".repeat(70) + "\n");

  let activatedCount = 0;
  let alreadyActiveCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (let i = 1; i <= projectCount; i++) {
    console.log("─".repeat(70));

    try {
      const project = await investment.getProject(i);

      console.log(`\n📋 Project #${i}: ${project.name}`);
      console.log(`   Target: ${hre.ethers.formatUnits(project.targetAmount, 6)} USDT`);
      console.log(`   Raised: ${hre.ethers.formatUnits(project.raisedAmount, 6)} USDT`);
      console.log(`   Status: ${project.isActive ? '✅ ACTIVE' : '❌ INACTIVE'}`);

      if (project.isActive) {
        console.log(`   ⭐ Already active, skipping`);
        alreadyActiveCount++;
        continue;
      }

      // Try to activate
      if (hasActivateFunction) {
        console.log(`   ⏳ Activating...`);

        try {
          const tx = await investment.activateProject(i, {
            gasLimit: 150000
          });

          console.log(`   📝 TX: ${tx.hash}`);
          const receipt = await tx.wait();
          console.log(`   ✅ Activated in block ${receipt.blockNumber}!`);
          console.log(`   🔗 View: https://sepolia.etherscan.io/tx/${tx.hash}`);

          activatedCount++;

          // Wait 2 seconds between transactions
          if (i < projectCount) {
            console.log(`   ⏸️  Waiting 2 seconds...`);
            await new Promise(r => setTimeout(r, 2000));
          }

        } catch (activateError) {
          console.log(`   ❌ Activation failed: ${activateError.message.substring(0, 100)}`);
          failedCount++;
        }
      } else {
        console.log(`   ⚠️  Cannot activate - function not available`);
        skippedCount++;
      }

    } catch (error) {
      console.log(`   ❌ Error loading project: ${error.message.substring(0, 100)}`);
      failedCount++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 ACTIVATION SUMMARY");
  console.log("=".repeat(70));
  console.log(`📈 Total projects:     ${projectCount}`);
  console.log(`✅ Newly activated:    ${activatedCount}`);
  console.log(`⭐ Already active:     ${alreadyActiveCount}`);
  console.log(`⚠️  Skipped (no func):  ${skippedCount}`);
  console.log(`❌ Failed:             ${failedCount}`);

  // Final verification
  console.log("\n" + "=".repeat(70));
  console.log("🔍 FINAL VERIFICATION");
  console.log("=".repeat(70));

  let activeCount = 0;
  let inactiveCount = 0;

  for (let i = 1; i <= projectCount; i++) {
    try {
      const project = await investment.getProject(i);
      const icon = project.isActive ? '✅' : '❌';
      const status = project.isActive ? 'ACTIVE' : 'INACTIVE';

      console.log(`${icon} Project #${i}: ${project.name.padEnd(30)} [${status}]`);

      if (project.isActive) {
        activeCount++;
      } else {
        inactiveCount++;
      }
    } catch (e) {
      console.log(`❌ Project #${i}: Error loading`);
      inactiveCount++;
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log(`✅ Active:   ${activeCount}/${projectCount}`);
  console.log(`❌ Inactive: ${inactiveCount}/${projectCount}`);
  console.log("=".repeat(70));

  if (inactiveCount > 0) {
    console.log("\n⚠️  WARNING: Some projects are still INACTIVE!");
    console.log("\n💡 TO FIX THIS:");
    console.log("\n1. Re-deploy the contract with the activateProject() function");
    console.log("   - Update contracts/SunChainInvestment.sol");
    console.log("   - Run: npx hardhat compile");
    console.log("   - Run: npx hardhat run scripts/deploy.js --network sepolia");
    console.log("\n2. Or modify createProject() to auto-activate new projects");
    console.log("\n3. Update contract addresses in your frontend and backend");

    console.log("\n📝 CONTRACT CODE TO ADD:");
    console.log("─".repeat(70));
    console.log(`
function activateProject(uint256 projectId) external onlyOwner {
    require(projectId > 0 && projectId <= projectCount, "Invalid project ID");
    require(!projects[projectId].isActive, "Already active");
    projects[projectId].isActive = true;
    emit ProjectActivated(projectId);
}

event ProjectActivated(uint256 indexed projectId);
    `);
    console.log("─".repeat(70));
  } else {
    console.log("\n🎉 SUCCESS! All projects are ACTIVE!");
    console.log("✅ Users can now invest in any project!");
    console.log("\n🚀 Next steps:");
    console.log("   1. Start backend: python app_web3.py");
    console.log("   2. Open: http://localhost:5000");
    console.log("   3. Test investment flow!");
  }

  console.log("\n" + "=".repeat(70));
  console.log("✨ Done!");
  console.log("=".repeat(70) + "\n");
}

main().catch((error) => {
  console.error("\n💥 ERROR:", error.message);
  console.error("\nStack trace:", error.stack);
  process.exitCode = 1;
});