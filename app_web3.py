"""
☀️ SunChain - Web3 Integrated Backend
Flask + Web3.py + Real Smart Contracts
"""

from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from web3 import Web3
from eth_account import Account
import json
from datetime import datetime
import os

# Load environment variables (install: pip install python-dotenv)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️  python-dotenv not installed. Using environment variables directly.")
    pass

app = Flask(__name__)
CORS(app)

# Configuration
ETHEREUM_RPC = os.getenv("ETHEREUM_RPC", "https://ethereum-sepolia-rpc.publicnode.com")
CHAIN_ID = int(os.getenv("CHAIN_ID", "11155111"))  # Sepolia testnet

# Contract addresses (deploy và điền vào đây)
USDT_ADDRESS = os.getenv("USDT_ADDRESS", "0x...")
SOLAR_TOKEN_ADDRESS = os.getenv("SOLAR_TOKEN_ADDRESS", "0x...")
INVESTMENT_CONTRACT = os.getenv("INVESTMENT_CONTRACT", "0x...")
ORACLE_CONTRACT = os.getenv("ORACLE_CONTRACT", "0x...")

# Private key cho backend operations (SECURE THIS!)
ADMIN_PRIVATE_KEY = os.getenv("ADMIN_PRIVATE_KEY", "")

# Web3 setup
w3 = Web3(Web3.HTTPProvider(ETHEREUM_RPC))
if ADMIN_PRIVATE_KEY:
    admin_account = Account.from_key(ADMIN_PRIVATE_KEY)
else:
    admin_account = None

# ABIs (simplified - use full ABIs in production)
SOLAR_TOKEN_ABI = [
    {
        "inputs": [
            {"name": "investor", "type": "address"},
            {"name": "projectId", "type": "uint256"},
            {"name": "amount", "type": "uint256"}
        ],
        "name": "mintForInvestment",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

INVESTMENT_ABI = [
    {
        "inputs": [
            {"name": "projectId", "type": "uint256"},
            {"name": "usdtAmount", "type": "uint256"}
        ],
        "name": "invest",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "projectId", "type": "uint256"}],
        "name": "getProject",
        "outputs": [
            {
                "components": [
                    {"name": "id", "type": "uint256"},
                    {"name": "name", "type": "string"},
                    {"name": "targetAmount", "type": "uint256"},
                    {"name": "raisedAmount", "type": "uint256"},
                    {"name": "capacity", "type": "uint256"},
                    {"name": "roi", "type": "uint256"},
                    {"name": "active", "type": "bool"},
                    {"name": "beneficiary", "type": "address"}
                ],
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "investor", "type": "address"}],
        "name": "approveKYC",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "investor", "type": "address"}],
        "name": "kycApproved",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    }
]

# Initialize contracts
if SOLAR_TOKEN_ADDRESS != "0x..." and INVESTMENT_CONTRACT != "0x...":
    solar_token = w3.eth.contract(address=SOLAR_TOKEN_ADDRESS, abi=SOLAR_TOKEN_ABI)
    investment_contract = w3.eth.contract(address=INVESTMENT_CONTRACT, abi=INVESTMENT_ABI)
else:
    solar_token = None
    investment_contract = None

# Demo projects data
DU_AN = [
    {
        "id": 1,
        "ten": "Samsung Electronics Thái Nguyên",
        "khach_hang": "Samsung Vietnam",
        "vi_tri": "KCN Yên Bình, Thái Nguyên",
        "cong_suat": 5000,
        "roi": 18.5,
        "muc_tieu": 50000000000,
        "da_goi": 40000000000,
        "nha_dau_tu": 8234,
        "logo": "🏢"
    },
    {
        "id": 2,
        "ten": "Lego Manufacturing Bình Dương",
        "khach_hang": "LEGO Vietnam",
        "vi_tri": "KCN Việt Nam - Singapore",
        "cong_suat": 3000,
        "roi": 17.2,
        "muc_tieu": 30000000000,
        "da_goi": 18000000000,
        "nha_dau_tu": 3621,
        "logo": "🧱"
    },
    {
        "id": 3,
        "ten": "Pepsi Bottling Đồng Nai",
        "khach_hang": "PepsiCo Vietnam",
        "vi_tri": "KCN Biên Hòa 2",
        "cong_suat": 2500,
        "roi": 16.8,
        "muc_tieu": 25000000000,
        "da_goi": 15000000000,
        "nha_dau_tu": 2890,
        "logo": "🥤"
    }
]

@app.route('/')
def trang_chu():
    return render_template('index_web3.html',
        chain_id=CHAIN_ID,
        rpc_url=ETHEREUM_RPC,
        usdt_address=USDT_ADDRESS,
        solar_address=SOLAR_TOKEN_ADDRESS,
        investment_contract=INVESTMENT_CONTRACT,
        oracle_contract=ORACLE_CONTRACT
    )

@app.route('/api/du-an', methods=['GET'])
def lay_du_an():
    """Lấy danh sách dự án - có thể sync với blockchain"""
    projects = DU_AN.copy()

    # Sync với blockchain nếu có contracts
    if investment_contract:
        for project in projects:
            try:
                on_chain = investment_contract.functions.getProject(project['id']).call()
                project['da_goi'] = on_chain[3]  # raisedAmount
            except Exception as e:
                print(f"Error syncing project {project['id']}: {e}")

    return jsonify(projects)

@app.route('/api/du-an/<int:id>', methods=['GET'])
def lay_chi_tiet_du_an(id):
    du_an = next((p for p in DU_AN if p['id'] == id), None)
    if not du_an:
        return jsonify({"error": "Không tìm thấy dự án"}), 404
    return jsonify(du_an)

# In-memory KYC storage cho demo (replace with DB in production)
KYC_APPROVED_WALLETS = set()
KYC_PENDING_APPLICATIONS = {}  # wallet -> {full_name, id_number, timestamp, status}
KYC_AUTO_APPROVE = os.getenv("KYC_AUTO_APPROVE", "true").lower() == "true"

# Mock investment storage
MOCK_INVESTMENTS = []  # List of investments for demo

@app.route('/api/kyc/check', methods=['POST'])
def check_kyc():
    """Kiểm tra KYC status"""
    data = request.json
    wallet = data.get('wallet_address')

    if not wallet:
        return jsonify({"approved": False})

    wallet_lower = wallet.lower()

    # Check in-memory first (for demo)
    if wallet_lower in KYC_APPROVED_WALLETS:
        return jsonify({"approved": True})

    # Then check on-chain if contract exists
    if investment_contract:
        try:
            approved = investment_contract.functions.kycApproved(
                w3.to_checksum_address(wallet)
            ).call()
            return jsonify({"approved": approved})
        except Exception as e:
            print(f"Error checking on-chain KYC: {e}")

    return jsonify({"approved": False})

@app.route('/api/kyc/submit', methods=['POST'])
def submit_kyc():
    """Submit KYC application"""
    data = request.json
    wallet = data.get('wallet_address')
    full_name = data.get('full_name')
    id_number = data.get('id_number')

    if not all([wallet, full_name, id_number]):
        return jsonify({"success": False, "message": "Thiếu thông tin"}), 400

    wallet_lower = wallet.lower()

    # Save application
    KYC_PENDING_APPLICATIONS[wallet_lower] = {
        "wallet": wallet,
        "full_name": full_name,
        "id_number": id_number,
        "timestamp": datetime.now().isoformat(),
        "status": "pending"
    }

    if KYC_AUTO_APPROVE:
        # Demo mode: Auto-approve
        KYC_APPROVED_WALLETS.add(wallet_lower)
        KYC_PENDING_APPLICATIONS[wallet_lower]["status"] = "approved"
        print(f"✅ KYC AUTO-APPROVED (DEMO MODE): {wallet}")

        return jsonify({
            "success": True,
            "message": "KYC đã được phê duyệt! (Demo mode - tự động)",
            "status": "approved"
        })
    else:
        # Production mode: Pending review
        print(f"📋 KYC SUBMITTED (PRODUCTION MODE): {wallet}")
        return jsonify({
            "success": True,
            "message": "KYC đang được xử lý. Vui lòng chờ admin xét duyệt.",
            "status": "pending"
        })

@app.route('/api/kyc/approve', methods=['POST'])
def approve_kyc():
    """Admin approve KYC"""
    data = request.json
    wallet = data.get('wallet_address')

    if not wallet or not admin_account or not investment_contract:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    try:
        # Build transaction
        txn = investment_contract.functions.approveKYC(
            w3.to_checksum_address(wallet)
        ).build_transaction({
            'from': admin_account.address,
            'gas': 200000,
            'gasPrice': w3.eth.gas_price,
            'nonce': w3.eth.get_transaction_count(admin_account.address)
        })

        # Sign and send
        signed = admin_account.sign_transaction(txn)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)

        return jsonify({
            "success": True,
            "tx_hash": tx_hash.hex(),
            "message": "KYC approved"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/token-balance/<wallet_address>', methods=['GET'])
def token_balance(wallet_address):
    """Lấy số dư SOLAR token"""
    if not solar_token:
        return jsonify({"balance": 0})

    try:
        balance = solar_token.functions.balanceOf(
            w3.to_checksum_address(wallet_address)
        ).call()
        return jsonify({"balance": balance / 10**18})
    except Exception as e:
        return jsonify({"balance": 0, "error": str(e)})

@app.route('/api/portfolio/<wallet_address>', methods=['GET'])
def portfolio(wallet_address):
    """Lấy portfolio của investor"""
    wallet_lower = wallet_address.lower()

    # Get investments from mock storage
    investments = [inv for inv in MOCK_INVESTMENTS if inv['wallet'].lower() == wallet_lower]

    if not investments:
        return jsonify({
            "wallet": wallet_address,
            "tong_dau_tu": 0,
            "tong_token": 0,
            "loi_nhuan_thang": 0,
            "du_an": []
        })

    tong_dau_tu = sum(inv['amount'] for inv in investments)
    tong_token = sum(inv['tokens'] for inv in investments)
    loi_nhuan_thang = int(tong_dau_tu * 0.15 / 12)  # 15% average ROI

    du_an_list = []
    for inv in investments:
        project_id = inv['project_id']
        du_an = next((p for p in DU_AN if p['id'] == project_id), None)
        if du_an:
            du_an_list.append({
                "ten": du_an['ten'],
                "dau_tu": inv['amount'],
                "tokens": inv['tokens'],
                "roi": du_an['roi'],
                "timestamp": inv['timestamp']
            })

    return jsonify({
        "wallet": wallet_address,
        "tong_dau_tu": tong_dau_tu,
        "tong_token": tong_token,
        "loi_nhuan_thang": loi_nhuan_thang,
        "du_an": du_an_list
    })

# ==================== MOCK INVESTMENT ENDPOINT ====================

@app.route('/api/mock-invest', methods=['POST'])
def mock_invest():
    """Mock investment for demo (no blockchain needed)"""
    try:
        data = request.json
        wallet = data.get('wallet_address')
        project_id = data.get('project_id')
        amount = data.get('amount')  # In USDT (can be small for demo)

        if not all([wallet, project_id, amount]):
            return jsonify({"success": False, "message": "Thiếu thông tin"}), 400

        # Check KYC
        if wallet.lower() not in KYC_APPROVED_WALLETS:
            return jsonify({"success": False, "message": "Chưa KYC hoặc chưa được duyệt"}), 403

        # Validate amount
        if amount < 0.5:  # Min 0.5 USDT for demo
            return jsonify({"success": False, "message": "Số tiền tối thiểu 0.5 USDT"}), 400

        # Get project
        du_an = next((p for p in DU_AN if p['id'] == project_id), None)
        if not du_an:
            return jsonify({"success": False, "message": "Không tìm thấy dự án"}), 404

        # Calculate tokens (simple: 1 USDT = 2 SOLAR)
        tokens = int(amount * 2)

        # Update project stats
        du_an['da_goi'] += int(amount * 1000000)  # Convert to VND equivalent
        du_an['nha_dau_tu'] += 1

        # Save investment
        investment = {
            "wallet": wallet,
            "project_id": project_id,
            "amount": amount,
            "tokens": tokens,
            "timestamp": datetime.now().isoformat(),
            "tx_hash": f"0x{''.join([format(hash(str(datetime.now()) + wallet) % 16, 'x') for _ in range(64)])}"
        }
        MOCK_INVESTMENTS.append(investment)

        print(f"✅ MOCK INVESTMENT: {wallet} invested {amount} USDT in project {project_id}")

        return jsonify({
            "success": True,
            "message": "Đầu tư thành công!",
            "tx_hash": investment['tx_hash'],
            "tokens": tokens,
            "amount": amount
        })

    except Exception as e:
        print(f"Error in mock invest: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/thong-ke', methods=['GET'])
def thong_ke():
    tong_ndt = sum(p['nha_dau_tu'] for p in DU_AN)
    tong_cong_suat = sum(p['cong_suat'] for p in DU_AN)

    return jsonify({
        "tong_nha_dau_tu": tong_ndt,
        "tong_cong_suat_kw": tong_cong_suat,
        "tong_cong_suat_mw": tong_cong_suat / 1000,
        "tong_da_goi": sum(p['da_goi'] for p in DU_AN),
        "co2_giam": int(tong_cong_suat * 1.6),
        "roi_trung_binh": sum(p['roi'] for p in DU_AN) / len(DU_AN)
    })

# ==================== ADMIN ENDPOINTS ====================

@app.route('/api/admin/kyc/list', methods=['GET'])
def admin_list_kyc():
    """List all KYC applications"""
    applications = []
    for wallet, data in KYC_PENDING_APPLICATIONS.items():
        applications.append({
            **data,
            "approved": wallet in KYC_APPROVED_WALLETS
        })

    return jsonify({
        "applications": applications,
        "total": len(applications),
        "approved_count": len(KYC_APPROVED_WALLETS),
        "pending_count": sum(1 for d in KYC_PENDING_APPLICATIONS.values() if d["status"] == "pending")
    })

@app.route('/api/admin/kyc/approve/<wallet_address>', methods=['POST'])
def admin_approve_kyc(wallet_address):
    """Admin manually approve KYC"""
    try:
        wallet_lower = wallet_address.lower()

        if wallet_lower not in KYC_PENDING_APPLICATIONS:
            return jsonify({
                "success": False,
                "message": "Application not found"
            }), 404

        KYC_APPROVED_WALLETS.add(wallet_lower)
        KYC_PENDING_APPLICATIONS[wallet_lower]["status"] = "approved"

        print(f"✅ ADMIN APPROVED KYC: {wallet_address}")

        return jsonify({
            "success": True,
            "message": f"KYC approved for {wallet_address}",
            "approved_count": len(KYC_APPROVED_WALLETS)
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/admin/kyc/reject/<wallet_address>', methods=['POST'])
def admin_reject_kyc(wallet_address):
    """Admin reject KYC"""
    try:
        wallet_lower = wallet_address.lower()

        if wallet_lower not in KYC_PENDING_APPLICATIONS:
            return jsonify({
                "success": False,
                "message": "Application not found"
            }), 404

        KYC_PENDING_APPLICATIONS[wallet_lower]["status"] = "rejected"

        # Remove from approved if was there
        if wallet_lower in KYC_APPROVED_WALLETS:
            KYC_APPROVED_WALLETS.remove(wallet_lower)

        print(f"❌ ADMIN REJECTED KYC: {wallet_address}")

        return jsonify({
            "success": True,
            "message": f"KYC rejected for {wallet_address}"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    """Admin statistics"""
    return jsonify({
        "kyc": {
            "total_applications": len(KYC_PENDING_APPLICATIONS),
            "approved": len(KYC_APPROVED_WALLETS),
            "pending": sum(1 for d in KYC_PENDING_APPLICATIONS.values() if d["status"] == "pending"),
            "rejected": sum(1 for d in KYC_PENDING_APPLICATIONS.values() if d["status"] == "rejected")
        },
        "projects": {
            "total": len(DU_AN),
            "total_target": sum(p['muc_tieu'] for p in DU_AN),
            "total_raised": sum(p['da_goi'] for p in DU_AN),
            "total_investors": sum(p['nha_dau_tu'] for p in DU_AN)
        },
        "mode": {
            "auto_approve": KYC_AUTO_APPROVE
        }
    })

@app.route('/admin')
def admin_dashboard():
    """Admin dashboard page"""
    return render_template('admin.html',
        chain_id=CHAIN_ID,
        rpc_url=ETHEREUM_RPC,
        auto_approve=KYC_AUTO_APPROVE
    )

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "blockchain_connected": w3.is_connected(),
        "contracts_deployed": SOLAR_TOKEN_ADDRESS != "0x..." and INVESTMENT_CONTRACT != "0x...",
        "admin_configured": admin_account is not None
    })

if __name__ == '__main__':
    print("=" * 70)
    print("🌞 SunChain Web3 Backend - http://localhost:5000")
    print(f"📡 Blockchain: {'Connected' if w3.is_connected() else 'Disconnected'}")
    print(f"📝 Contracts: {'Deployed' if SOLAR_TOKEN_ADDRESS != '0x...' else 'Not deployed'}")
    print("=" * 70)
    app.run(debug=True, host='0.0.0.0', port=5000)