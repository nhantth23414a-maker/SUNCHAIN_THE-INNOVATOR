"""
Script approve KYC cho investor
Run: python approve_kyc.py <INVESTOR_ADDRESS>
"""

from web3 import Web3
from eth_account import Account
import sys

# Configuration
POLYGON_RPC = "https://rpc-amoy.polygon.technology/"
INVESTMENT_CONTRACT = "0x..."  # Thay bằng địa chỉ contract của bạn
ADMIN_PRIVATE_KEY = "0x..."  # Thay bằng private key của bạn

# ABI cho approveKYC function
INVESTMENT_ABI = [{
    "inputs": [{"name": "investor", "type": "address"}],
    "name": "approveKYC",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}]


def approve_kyc(investor_address):
    # Connect to blockchain
    w3 = Web3(Web3.HTTPProvider(POLYGON_RPC))

    if not w3.is_connected():
        print("❌ Cannot connect to Polygon RPC")
        return

    print(f"✅ Connected to Polygon Amoy")

    # Load admin account
    admin_account = Account.from_key(ADMIN_PRIVATE_KEY)
    print(f"👤 Admin: {admin_account.address}")

    # Load contract
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(INVESTMENT_CONTRACT),
        abi=INVESTMENT_ABI
    )

    # Build transaction
    print(f"\n🔨 Building transaction to approve: {investor_address}")

    txn = contract.functions.approveKYC(
        Web3.to_checksum_address(investor_address)
    ).build_transaction({
        'from': admin_account.address,
        'gas': 200000,
        'gasPrice': w3.eth.gas_price,
        'nonce': w3.eth.get_transaction_count(admin_account.address)
    })

    # Sign transaction
    print("✍️  Signing transaction...")
    signed = admin_account.sign_transaction(txn)

    # Send transaction
    print("📤 Sending transaction...")
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)

    print(f"⏳ Transaction sent: {tx_hash.hex()}")
    print(f"🔍 View on explorer: https://amoy.polygonscan.com/tx/{tx_hash.hex()}")

    # Wait for confirmation
    print("⏳ Waiting for confirmation...")
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    if receipt['status'] == 1:
        print("\n✅ KYC APPROVED SUCCESSFULLY!")
        print(f"✅ {investor_address} can now invest!")
    else:
        print("\n❌ Transaction failed!")
        print(f"Receipt: {receipt}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python approve_kyc.py <INVESTOR_ADDRESS>")
        print("\nExample:")
        print("  python approve_kyc.py 0x1234567890123456789012345678901234567890")
        sys.exit(1)

    investor = sys.argv[1]

    # Validate address
    if not investor.startswith('0x') or len(investor) != 42:
        print("❌ Invalid Ethereum address!")
        sys.exit(1)

    print("=" * 70)
    print("🎫 SunChain KYC Approval")
    print("=" * 70)

    approve_kyc(investor)