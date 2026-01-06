Sistem Kasir POS (Point of Sale) 🛒💻
https://public/photo_app/dasboard_ui.jpeg

📋 Tentang Proyek
Sistem Kasir Point of Sale (POS) modern yang dirancang untuk toko retail dengan fitur lengkap untuk manajemen transaksi, inventori, dan laporan keuangan. Dibangun dengan React dan teknologi web terbaru untuk performa optimal dan pengalaman pengguna yang intuitif.

✨ Fitur Utama
🛒 Transaksi Kasir
Scan barcode otomatis dengan dukungan berbagai jenis scanner

Input manual produk dengan pencarian real-time

Multi-satuan (pcs, pack, dozen, dll) dengan konversi harga otomatis

Sistem diskon fleksibel (persentase, nominal, promo khusus)

Perhitungan kembalian real-time

📊 Manajemen Produk
Database produk dengan kode barcode unik

Stok otomatis berkurang saat transaksi

Kategori dan sub-kategori produk

Harga jual berbeda berdasarkan satuan

Promo dan diskon spesial

📈 Laporan & Analisis
Laporan penjualan harian,


Login dengan autentikasi secure

Riwayat transaksi per user

Batasan akses berdasarkan role

🖼️ Screenshots Aplikasi
1. Dashboard Kasir Utama
https://public/photo_app/dasboard_ui.jpeg
Tampilan utama kasir dengan keranjang belanja, pencarian produk, dan form pembayaran

2. Manajemen Produk
https://public/photo_app/produk.jpeg
Interface untuk menambah, mengedit, dan mengelola katalog produk

3. Laporan Penjualan
https://public/photo_app/login_ui.jpeg
Login Ui Untuk Autentikasi

4. Mobile Responsive
https://public/photo_app/mobile_ui.jpeg
Tampilan optimal untuk tablet dan perangkat mobile

🛠️ Teknologi yang Digunakan
Teknologi	Kegunaan
React 18	UI Framework utama
Vite	Build tool ultra cepat
Tailwind CSS	Styling utility-first
React Router	Navigasi SPA
Axios	HTTP client untuk API
SweetAlert2	Notifikasi modern
React Hook Form	Form validation
Zustand/Context API	State management
ESLint + Prettier	Code quality
🚀 Instalasi & Menjalankan
Prasyarat
Node.js 18+ dan npm/yarn

Database MySQL/PostgreSQL

Barcode scanner (opsional, untuk fitur scan)

Instalasi
bash
# Clone repository
git clone [repository-url]
cd kasir-pos

# Install dependencies
npm install
# atau
yarn install

# Setup environment
cp .env.example .env.local
# Edit file .env.local dengan konfigurasi database Anda

# Jalankan development server
npm run dev
# atau
yarn dev
Build untuk Production
bash
npm run build
npm run preview
📁 Struktur Proyek
text
src/
├── components/     # Komponen React reusable
│   ├── kasir/     # Komponen khusus kasir
│   ├── layout/    # Layout komponen
│   └── ui/        # Komponen UI dasar
├── pages/         # Halaman aplikasi
├── hooks/         # Custom hooks
├── api/           # Konfigurasi API
├── utils/         # Utility functions
├── styles/        # Global styles
└── assets/        Gambar, font, dll
🔧 Konfigurasi Barcode Scanner
Sistem mendukung berbagai jenis barcode scanner:

USB HID Keyboard Emulation (Plug & Play)

Serial/RS-232 Scanner (dengan konfigurasi port)

Wireless Bluetooth Scanner

Setup otomatis - Scanner langsung berfungsi setelah terkoneksi ke USB.

🎯 Target Pengguna
✅ Toko Retail (Fashion, Elektronik, Peralatan)

✅ Minimarket & Supermarket

✅ Toko Kebutuhan Sehari-hari

✅ Coffee Shop & Restoran

✅ Bisnis UMKM

📦 Fitur dalam Pengembangan
Integrasi payment gateway (QRIS, E-money)

Aplikasi mobile companion

Backup data ke cloud

Multi-gudang/stok

Loyalty program

Notifikasi stok menipis

👥 Kontribusi
Fork repository

Buat branch fitur (git checkout -b fitur-baru)

Commit perubahan (git commit -m 'Menambah fitur X')

Push ke branch (git push origin fitur-baru)

Buat Pull Request

📄 Lisensi
Proyek ini menggunakan lisensi MIT. Lihat file LICENSE untuk detail.