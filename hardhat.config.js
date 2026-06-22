require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337, // Dùng cho local testing
    },
    // Sepolia Testnet (Ethereum)
    sepolia: {
      url: process.env.ETHEREUM_RPC || "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
    // Amoy Testnet (Polygon)
    amoy: {
      url: "https://rpc-amoy.polygon.technology/",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80002,
    },
  },
  etherscan: {
    // API key cho Etherscan (Sepolia) hoặc PolygonScan (Amoy)
    // Bạn có thể đổi biến môi trường tùy theo mạng đang deploy
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true // Hỗ trợ verify contract tự động tốt hơn trên một số mạng
  }
};