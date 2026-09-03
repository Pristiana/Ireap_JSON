// ====================================================================
// ⚙️ 1. GLOBAL VARIABLE KONTROL PUSAT (GANTI DI SINI SAJA!)
// ====================================================================

// 🏬 PILIHAN TOKO: "ALL", "Emba Sembako & Sayur", atau "Emba Sembako & Sayur III"
var PILIH_TOKO = "ALL"; 

// 🗺️ KAMUS ID TOKO RESMI iREAP POS
var STORE_ID_MAP = {
  "ALL": "",
  "Emba Sembako & Sayur": "78191",
  "Emba Sembako & Sayur III": "138696",
  // Alias shortcut (tetap didukung jika ingin ketik cepat)
  "EMBA_1": "78191",
  "EMBA_3": "138696"
};

// 📅 RENTANG TANGGAL (PILIH SALAH SATU MODE):
// Mode 1: Mundur berapa hari dari hari ini (1 = kemarin, 7 = seminggu, 30 = sebulan)
var HARI_MUNDUR = 1; 

// Mode 2: Kunci tanggal manual (Kosongkan "" jika ingin otomatis pakai HARI_MUNDUR)
// Contoh isi: "2026/08/01"
var MANUAL_START_DATE = ""; 
var MANUAL_END_DATE = ""; 

// 🗺️ KAMUS ID TOKO iREAP
var STORE_ID_MAP = {
  "ALL": "",
  "EMBA_1": "78191",
  "EMBA_3": "138696"
};
