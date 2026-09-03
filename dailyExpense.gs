// 🧾 RAW DUMP: BIAYA HARIAN (ULTRA FAST EDITION - NO AJAX NEEDED!)
function RawDump_DailyExpense() {
  Logger.log("=================================================");
  Logger.log("🚀 [DAILY EXPENSE] Menembak laporan Biaya Harian (Mode Kilat)...");
  if (!COOKIE_SAKTI) loginCentratireap();

  var f = getGlobalFilter();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabName = "expense/report/daily";
  var sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);

  // 1. Tembak Halaman Induk Biaya Harian (Satu-satunya tembakan yang kita butuhkan!)
  var urlInduk = "https://pro.ireappos.com/expense/report/daily?storeid=" + f.storeId + "&startdate=" + f.tglAwal + "&enddate=" + f.tglAkhir;
  var resInduk = UrlFetchApp.fetch(urlInduk, {
    method: "get",
    headers: {
      "User-Agent": HEADERS_TOPENG["User-Agent"],
      "Cookie": COOKIE_SAKTI,
      "Referer": "https://pro.ireappos.com/expense/report/daily"
    },
    muteHttpExceptions: true
  });

  if (resInduk.getResponseCode() === 302) {
    Logger.log("⚠️ Sesi mati, ritual login ulang...");
    loginCentratireap();
    return RawDump_DailyExpense();
  }

  var html = resInduk.getContentText();
  var tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) {
    Logger.log("❌ Tag <tbody> Biaya Harian tidak ditemukan!");
    return;
  }

  var trMatches = tbodyMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  if (!trMatches || trMatches.length === 0) {
    Logger.log("⚠️ Tidak ada transaksi pada periode tersebut.");
    return;
  }

  // 2. Ekstraksi Langsung Tanpa Basa-Basi
  var parsedRows = [];

  trMatches.forEach(function(tr) {
    var tdMatches = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);

    // Bersihkan teks standar
    var tgl = tdMatches[0].replace(/<[^>]+>/g, '').trim();
    var docNo = tdMatches[1].replace(/<[^>]+>/g, '').trim(); 
    var store = tdMatches[2].replace(/<[^>]+>/g, '').trim();
    var total = tdMatches[3].replace(/<[^>]+>/g, '').replace(/,/g, '').trim();

    // 🎯 MATA ELANG V3: Panen dari onclick="viewTrx('ID', 'User', 'Time')"
    var rawCell = tdMatches[1];
    var docId = "-", createdBy = "-", trxTime = "-";
    
    // Regex menangkap 3 parameter di dalam kurung viewTrx()
    var trxMatch = rawCell.match(/viewTrx\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/i);
    
     if (trxMatch) {
      docId = trxMatch[1].trim();       // Parameter 1: ID Dokumen
      
      // ✂️ TEBAS KEPALA ID-NYA! Ambil buntut emailnya doang!
      var rawUser = trxMatch[2].trim();   
      createdBy = rawUser.split('/').pop().trim(); 
      
      trxTime = trxMatch[3].trim();     // Parameter 3: Waktu
    }
    

    // Filter baris totalan atau data kosong
    if (tgl !== "" && !tgl.toLowerCase().includes("total")) {
      parsedRows.push([tgl, docNo, store, Number(total) || total, trxTime, createdBy, docId]);
    }
  });

  // 3. Tumpahkan Data ke Spreadsheet
  var headersUI = ["Tanggal", "Nomor Dokumen", "Toko", "Jumlah Total", "Trx Time", "Created By", "Doc ID"];
  
  sheet.clear();
  sheet.getRange(1, 1, 1, headersUI.length).setValues([headersUI]).setFontWeight("bold").setBackground("#d0e0e3");
  
  if (parsedRows.length > 0) {
    sheet.getRange(2, 1, parsedRows.length, parsedRows[0].length).setValues(parsedRows);
    Logger.log("🎉 BOOM! " + parsedRows.length + " baris mendarat dengan kecepatan cahaya! ⚡");
  } else {
    Logger.log("⚠️ Transaksi kosong.");
  }
  Logger.log("=================================================");
}
