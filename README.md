# SANWANAY NETWORK - FTTH Monitoring Console 🛰️

**SANWANAY NETWORK** adalah dashboard *Network Operation Center* (NOC) premium yang dirancang khusus untuk ISP FTTH guna memantau Router MikroTik, perangkat OLT, dan topologi FO (Fiber Optic) secara *real-time*.

---

## 🚀 Fitur Utama (Key Features)

*   **Heuristic Topology Discovery**: Rekonstruksi otomatis topologi ODC/ODP dan mapping pelanggan dengan menscan MikroTik (comment/metadata) dan **Physical OLT Scanning**. **Gak perlu input manual satu-satu bro!** 🦾
*   **Multi-Vendor OLT Support**: Pantau redaman (dBm/RX Power) dan status ONU untuk perangkat **ZTE (C300/C600)** dan **HIOSO EPON**.
*   **MikroTik Orchestration**: Sinkronisasi otomatis data *PPPoE Secrets* dan pantau sesi aktif secara live.
*   **GIS Mapping Engine**: Peta interaktif ala Google Maps dengan mode **Satellite Hybrid**. Pelanggan baru otomatis muncul di sekitar ODP!

## 🛠️ Tech Stack

*   **Frontend**: Next.js 15+, Tailwind CSS, Lucide React, React Leaflet.
*   **Backend**: Node.js, Express, TypeScript.
*   **Database**: PostgreSQL (NeonDB Support) dengan Prisma ORM.
*   **Connection**: SNMP (v2c), RouterOS API, Telnet/SSH.

---

## 📦 Cara Instalasi (Installation Guide)

1.  **Backend Setup**:
    *   `npm install`
    *   Sesuaikan `.env` (Gunakan DATABASE_URL NeonDB atau Lokal).
    *   `npx prisma db push`
    *   `npm run dev` (Jalan di port 3005)

2.  **Frontend Setup**:
    *   `cd frontend && npm install`
    *   `npm run dev` (Jalan di port 3000)

## 📖 Cara Pakai (Usage Guide)

1.  **Add Equipment**: Daftarkan Router dan OLT (Pastikan SNMP Community sudah `public` di sisi perangkat).
2.  **Magic Discovery**: Klik tombol **"Discover Topology"**. Sistem bakal otomatis scan MikroTik dan Fisik OLT, lalu meletakkan pelanggan di peta! 🦾✨
3.  **Sync Hardware**: Klik **"Sync Hardware"** buat narik data signal (dBm) terbaru dari OLT secara massal.

## 🤝 Kontribusi
Boleh banget kalau mau fork project ini atau nambahin OID mapping buat vendor OLT lain. Gas pol!

## 📄 License
Project ini dilindungi Lisensi MIT.
