☀️ SunChain - Solar Energy Tokenization Platform

SunChain là nền tảng Web3 RWA (Real World Assets) cho phép token hóa năng lượng mặt trời. Nhà đầu tư sử dụng USDT để đầu tư vào các dự án điện mặt trời thực tế và nhận lại SolarToken (SOLAR) đại diện cho sản lượng điện và lợi nhuận.
Danh sách sinh viên thực hiện:

Phan Đặng Anh Kiệt - K234141653
Trần Thị Hoài Nhân - K234141662
Cao Huỳnh Tuyết Trân - K234141684
✨ Tính năng nổi bật
📂 1. Cấu trúc thư mục bắt buộc

QUAN TRỌNG: Backend Flask yêu cầu các file HTML phải nằm trong thư mục templates. Hãy sắp xếp file như sau:

sunchain/
├── contracts/               # Mã nguồn Smart Contract (.sol)
├── scripts/                 # Các script deploy và tool (.js)
├── templates/               # ⚠️ BẮT BUỘC PHẢI TẠO THƯ MỤC NÀY
│   ├── index_web3.html      # Giao diện nhà đầu tư
│   └── admin.html           # Giao diện Admin
├── app_web3.py              # Backend Server (Flask)
├── hardhat.config.js        # Cấu hình Blockchain
├── package.json             # Dependencies Frontend/Blockchain
├── requirements.txt         # Dependencies Python
└── .env                     # Biến môi trường (Key, API...)


🛠 2. Cài đặt môi trường

Bước 1: Cài đặt thư viện

Bạn cần cài đặt cả thư viện cho Node.js (Blockchain) và Python (Backend).

Node.js:

npm install

Đây là lệnh để cài đặt trực tiếp các thư viện Python này vào máy của bạn:

Bash

pip install Flask Flask-Cors web3 python-dotenv
Hoặc nếu bạn đã lưu file requirements.txt, chỉ cần chạy:

Bash

pip install -r requirements.txt


Bước 2: Cấu hình .env

Tạo file .env tại thư mục gốc và điền thông tin của bạn:

# --- Blockchain Config ---
SEPOLIA_RPC_URL=[https://ethereum-sepolia-rpc.publicnode.com](https://ethereum-sepolia-rpc.publicnode.com)
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key

# --- Backend Config ---
FLASK_APP=app_web3.py
FLASK_ENV=development


🚀 3. Deploy Smart Contracts

Chúng ta sẽ deploy hệ thống gồm: USDT (Mock) -> SolarToken -> Investment -> Oracle.

Biên dịch contract:

npx hardhat compile


Deploy lên mạng Sepolia:

npx hardhat run scripts/deploy.js --network sepolia


Tự động: Sau khi deploy, script sẽ tự chạy generate_config.js để tạo file config.js (chứa địa chỉ contract) cho Frontend dùng.

⚙️ 4. Khởi tạo dữ liệu mẫu (Admin)

Sau khi deploy, contract sẽ trống trơn. Bạn cần tạo dữ liệu để test:

Tạo dự án mẫu:

npx hardhat run scripts/create_project.js --network sepolia


Kích hoạt dự án (Bắt buộc):
Mặc định dự án tạo ra sẽ ở trạng thái Pending. Cần kích hoạt để nhà đầu tư thấy:

npx hardhat run scripts/activate_projects.js --network sepolia


Mint USDT giả để test (cho ví của bạn):

npx hardhat run scripts/mint_usdt.js --network sepolia


🖥️ 5. Chạy ứng dụng

Khởi động Backend Flask:

python app_web3.py


Truy cập trình duyệt:

Trang chủ (Nhà đầu tư): http://localhost:5000/

Trang quản trị (Admin): http://localhost:5000/admin

🧪 6. Hướng dẫn Test luồng đầu tư

Bạn có thể chạy script test tự động để kiểm tra toàn bộ quy trình (Approve -> Invest -> Nhận SolarToken):

npx hardhat run scripts/test_invest.js --network sepolia


Quy trình duyệt KYC thủ công (nếu cần):

Nếu trên giao diện báo "Chưa KYC", bạn có thể duyệt nhanh bằng script:

# Thay địa chỉ ví cần duyệt vào bên dưới
node scripts/approve_kyc.js 0xYourWalletAddress --network sepolia


⚠️ Lưu ý quan trọng

Bảo mật: Không bao giờ commit file .env chứa Private Key lên Github.

Lỗi Template Not Found: Nếu chạy Python báo lỗi này, hãy kiểm tra lại xem bạn đã tạo thư mục templates và bỏ 2 file HTML vào đó chưa (xem mục 1).

MockUSDT: Contract USDT này có hàm faucet() cho phép bất kỳ ai lấy tiền, chỉ dùng cho môi trường Testnet.
