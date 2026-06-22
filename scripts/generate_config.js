const fs = require('fs');
require('dotenv').config();

const config = `// Auto-generated - DO NOT EDIT MANUALLY
// Run: node scripts/generate_config.js after deploy

const CONFIG = {
    chainId: ${process.env.CHAIN_ID || 11155111},
    chainName: 'Sepolia Testnet',
    rpcUrl: '${process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'}',
    blockExplorer: 'https://sepolia.etherscan.io',
    contracts: {
        usdt: '${process.env.USDT_ADDRESS}',
        solar: '${process.env.SOLAR_TOKEN_ADDRESS}',
        investment: '${process.env.INVESTMENT_CONTRACT}'
    }
};

console.log('📋 Current config:', CONFIG);
`;

fs.writeFileSync('config.js', config);
console.log('✅ Generated config.js from .env');
console.log('📍 Contracts:');
console.log('   USDT:', process.env.USDT_ADDRESS);
console.log('   SOLAR:', process.env.SOLAR_TOKEN_ADDRESS);
console.log('   INVESTMENT:', process.env.INVESTMENT_CONTRACT);