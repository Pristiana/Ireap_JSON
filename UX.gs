// 🎛️ UX & ORKESTRASI (KOMANDAN UTAMA - BULLETPROOF)
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('🚀 iREAP SAKTI')
      .addItem('⚡ SIKAT SEMUA TAB! (Sapu Jagat)', 'RawDump_SEMUA_TAB')
      .addSeparator()
      .addItem('1️⃣ Tarik Header Penerimaan (GR)', 'RawDump_goodReceipt')
      .addItem('2️⃣ Tarik Header Pengeluaran (GI)', 'RawDump_goodIssue')
      .addItem('3️⃣ Tarik Rincian Penerimaan (GR Detail)', 'RawDump_GRDetail')
      .addItem('4️⃣ Tarik Rincian Pengeluaran (GI Detail)', 'RawDump_GIDetail')
      .addSeparator()
      .addItem('🧾 Tarik Biaya Harian', 'RawDump_DailyExpense')
      .addItem('💳 Tarik Cash/Bank', 'RawDump_ExpenseDetailCI')
      .addItem('📦 Tarik Mutasi Stok (StockPOS)', 'RawDump_StockPOS')
      .addToUi();
  } catch (e) {
    Logger.log("ℹ️ onOpen diskip karena berjalan di luar konteks UI Spreadsheet.");
  }
}

function RawDump_SEMUA_TAB() {
  var ui = null;
  var hasUi = false;
  
  // 🛡️ Deteksi apakah dijalankan dari UI Sheet atau dari Editor
  try {
    ui = SpreadsheetApp.getUi();
    hasUi = true;
  } catch (err) {
    Logger.log("ℹ️ Dijalankan langsung dari Editor (Tanpa UI). Melanjutkan tanpa pop-up konfirmasi.");
  }

  var proceed = true;
  
  // Kalau ada UI (diklik dari menu Sheets), munculin pop-up konfirmasi
  if (hasUi) {
    var res = ui.alert(
      "🔥 KONFIRMASI OPERASI SAPU JAGAT 🔥", 
      "Mau sedot SEMUA data iREAP dari 7 Tab sekaligus berdasarkan filter tanggal lu?\n\nSabar ya, ini bakal makan waktu belasan detik karena servernya kita serang bertubi-tubi!", 
      ui.ButtonSet.YES_NO
    );
    if (res != ui.Button.YES) {
      proceed = false;
    }
  }

  if (proceed) {
    Logger.log("=================================================");
    Logger.log("🚀 [COMMAND CENTER] MEMULAI OPERASI SAPU JAGAT...");

    // 1. Amankan Kunci Sesi Login
    if (typeof COOKIE_SAKTI === 'undefined' || !COOKIE_SAKTI) {
      Logger.log("🔑 Sesi belum ada, ritual login sentral...");
      loginCentratireap();
    }

    try {
      // 2. GELOMBANG PERTAMA: Tab Independen
      Logger.log("🌊 Gelombang 1: Menyedot Data Independen...");
      RawDump_DailyExpense();
      RawDump_ExpenseDetailCI();
      RawDump_StockPOS();

      // 3. GELOMBANG KEDUA: Tab Header (WAJIB DULUAN!)
      Logger.log("🌊 Gelombang 2: Menyedot Induk/Header Transaksi...");
      RawDump_goodReceipt();
      RawDump_goodIssue();

      // 4. GELOMBANG KETIGA: Tab Detail (Suntik VLOOKUP In-Memory)
      Logger.log("🌊 Gelombang 3: Menyedot Detail & Menyuntik Kasir...");
      RawDump_GRDetail();
      RawDump_GIDetail();

      Logger.log("🎉 OPERASI SAPU JAGAT SELESAI TANPA CASUALTY!");
      Logger.log("=================================================");
      
      if (hasUi) {
        ui.alert("🏆 JACKPOT!", "Operasi Sapu Jagat SUKSES!\n\nSemua 7 Tab udah ditarik lurus sesuai filter, dan nama kasir udah disuntik rapi ke rincian barang!", ui.ButtonSet.OK);
      }

    } catch (e) {
      Logger.log("❌ TRAGEDI DI TENGAH JALAN: " + e.message);
      if (hasUi) {
        ui.alert("💀 WADUH ERROR BOZZ!", "Ada yang nyangkut pas proses:\n" + e.message, ui.ButtonSet.OK);
      } else {
        throw e;
      }
    }
  } else {
    Logger.log("🛑 Operasi Sapu Jagat dibatalkan oleh Komandan.");
  }
}
