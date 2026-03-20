# SANWANAY NETWORK - FTTH Monitoring Console 🛰️

**SANWANAY NETWORK** adalah dashboard *Network Operation Center* (NOC) premium yang dirancang khusus untuk ISP FTTH guna memantau Router MikroTik, perangkat OLT, dan topologi FO (Fiber Optic) secara *real-time*.

---

## 🚀 Fitur Utama (Key Features)

*   **Heuristic Topology Discovery**: Rekonstruksi otomatis topologi ODC/ODP dan mapping pelanggan hanya dengan membaca metadata/comment dari MikroTik & OLT. **Gak perlu input manual satu-satu bro!** 🦾
*   **Multi-Vendor OLT Support**: Pantau redaman (dBm/RX Power) dan status ONU untuk perangkat **ZTE (C300/C600)** dan **HIOSO EPON**.
*   **MikroTik Orchestration**: Sinkronisasi otomatis data *PPPoE Secrets* dan pantau sesi aktif secara live.
*   **GIS Mapping Engine**: Peta interaktif ala Google Maps dengan mode **Satellite Hybrid**. Dilengkapi garis penarik (polyline) dari ODP ke rumah pelanggan.
*   **Operational Health Dashboard**: Visualisasi grafik throughput, latency, dan integritas sistem yang modern.
*   **Integrated Inventory**: Registry terpusat untuk mengelola aset OLT, Router, Box ODC, dan Terminal ODP.

## 🛠️ Tech Stack

*   **Frontend**: Next.js 15+, Tailwind CSS, Lucide React, React Leaflet.
*   **Backend**: Node.js, Express, TypeScript.
*   **Database**: PostgreSQL dengan Prisma ORM.
*   **Connection**: SNMP (net-snmp), RouterOS API, Telnet/SSH.

---

## 📦 Cara Instalasi (Installation Guide)

Ikuti langkah-langkah di bawah ini untuk menjalankan project di lokal abang.

### 1. Persiapan (Prerequisites)
Pastikan sudah terinstall:
*   [Node.js](https://nodejs.org/) (v18 ke atas)
*   [PostgreSQL](https://www.postgresql.org/) (Sudah running)

### 2. Clone Repository
```bash
git clone https://github.com/yourusername/monit-ftth.git
cd monit-ftth
```

### 3. Konfigurasi Backend
Buat file bernama `.env` di folder **paling luar (root)**:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/monit_db?schema=public"
GENIE_ACS_URL="http://your-genie-acs:7557"
PORT=3005
```

Install library dan setup database:
```bash
npm install
npx prisma db push
```

### 4. Konfigurasi Frontend
Masuk ke folder frontend dan install library-nya:
```bash
cd frontend
npm install
```

### 5. Menjalankan Aplikasi (Run App)
Abang harus jalanin **DUA** terminal sekaligus.

**Terminal 1 (Backend - Folder Root):**
```bash
npm run dev
```
*Backend jalan di `http://localhost:3005`*

**Terminal 2 (Frontend - Folder /frontend):**
```bash
npm run dev
```
*Dashboard jalan di `http://localhost:3001`*

---

## 📖 Cara Pakai (Usage Guide)

1.  **Input Mesin Utama**: Masuk ke menu `Device Inventory`, lalu daftarin Router MikroTik dan OLT abang.
2.  **Magic Discovery**: Klik tombol **"Discover Topology"**. Sistem bakal otomatis scan komen di MikroTik (misal: `ODP-MAWAR-01`) dan langsung ngebentuk box ODP di peta! 🦾✨
3.  **Pantau Redaman**: Cek **Global Map** buat liat siapa aja pelanggan yang redamannya jelek (dBm tinggi) atau yang lagi LOS (Merah).

## 🤝 Kontribusi
Boleh banget kalau mau fork project ini atau nambahin OID mapping buat vendor OLT lain. Gas pol!

## 📄 License
Project ini dilindungi Lisensi MIT.
