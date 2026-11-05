// ====================================================================
// ⚙️ 1. GLOBAL VARIABLE KONTROL PUSAT (SMART AUTO-PILOT)
// ====================================================================

// 🏬 PILIHAN TOKO
var PILIH_TOKO = "ALL";

// 🗺️ KAMUS ID TOKO RESMI iREAP POS (Cukup 1 kali deklarasi!)
var STORE_ID_MAP = {
  "ALL": "",
  "Emba Sembako & Sayur": "78191",
  "Emba Sembako & Sayur III": "138696",
  "EMBA_1": "78191",
  "EMBA_3": "138696"
};

// ====================================================================
// 📅 2. SMART AUTO-DATE DETECTOR (ANTI MANUALAN)
// ====================================================================
// 💡 ATURAN MAIN:
// - Kalau ada kasus khusus (SO telat kayak Oktober): ISI string tanggalnya.
// - Kalau mau FULL AUTO 1 BULAN PENUH (November dst): KOSONGKAN jadi ""!

var MANUAL_START_DATE = "2026/10/03"; // Kosongkan "" untuk Full Auto M-1
var MANUAL_END_DATE   = "2026/10/31"; // Kosongkan "" untuk Full Auto M-1

// Mesin hitung tanggal otomatis bulan lalu (M-1)
function getAutoMonthRange() {
  var now = new Date();
  // Tanggal 1 bulan lalu
  var firstDayPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  // Tanggal terakhir bulan lalu
  var lastDayPrev  = new Date(now.getFullYear(), now.getMonth(), 0);
  
  var formatYMD = function(d) {
    var yyyy = d.getFullYear();
    var mm = ("0" + (d.getMonth() + 1)).slice(-2);
    var dd = ("0" + d.getDate()).slice(-2);
    return yyyy + "/" + mm + "/" + dd;
  };
  
  return {
    start: formatYMD(firstDayPrev),
    end: formatYMD(lastDayPrev)
  };
}

// 🎯 TANGGAL FINAL YANG DIGUNAKAN API
var autoRange = getAutoMonthRange();
var START_DATE = (MANUAL_START_DATE && MANUAL_START_DATE.trim() !== "") ? MANUAL_START_DATE : autoRange.start;
var END_DATE   = (MANUAL_END_DATE && MANUAL_END_DATE.trim() !== "") ? MANUAL_END_DATE : autoRange.end;

Logger.log("🚀 Rentang Tanggal Aktif: " + START_DATE + " s/d " + END_DATE);
