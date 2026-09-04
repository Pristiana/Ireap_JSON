// 🧾 RAW DUMP: BIAYA HARIAN (POST PAYLOAD RESMI - ULTRA FAST)
function RawDump_DailyExpense() {
  Logger.log("=================================================");
  Logger.log("🚀 [DAILY EXPENSE] Menembak Biaya Harian (Metode POST Payload)...");
  
  // 1. Kunci Sesi Login di Awal
  if (!COOKIE_SAKTI) loginCentratireap();

  var f = getGlobalFilter();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabName = "expense/report/daily";
  var sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);

  // 2. Terjemahkan Filter Toko ke Bahasa iREAP (0 = ALL)
  var targetStoreId = (!f.storeId || f.storeId === "ALL" || f.storeId === "") ? "0" : f.storeId;
  Logger.log("🎯 Filter Aktif -> Toko: " + (targetStoreId === "0" ? "ALL (0)" : targetStoreId) + " | Rentang: " + f.tglAwal + " s/d " + f.tglAkhir);

  var targetUrl = "https://pro.ireappos.com/expense/report/daily";
  
  // 🎯 PAYLOAD SAKTI HASIL X-RAY
  var payload = {
    "store": targetStoreId,
    "daterange": f.tglAwal + " - " + f.tglAkhir,
    "startdate": f.tglAwal,
    "enddate": f.tglAkhir
  };

  // 3. Tembak POST ke Server
  var res = UrlFetchApp.fetch(targetUrl, {
    method: "post",
    headers: {
      "User-Agent": HEADERS_TOPENG["User-Agent"],
      "Cookie": COOKIE_SAKTI,
      "Referer": "https://pro.ireappos.com/expense/report/daily"
    },
    payload: payload,
    muteHttpExceptions: true
  });

  // Auto-login jika HTTP 302 (Sesi Expired)
  if (res.getResponseCode() === 302) {
    Logger.log("⚠️ Sesi mati, ritual login ulang...");
    loginCentratireap();
    res = UrlFetchApp.fetch(targetUrl, {
      method: "post",
      headers: {
        "User-Agent": HEADERS_TOPENG["User-Agent"],
        "Cookie": COOKIE_SAKTI,
        "Referer": "https://pro.ireappos.com/expense/report/daily"
      },
      payload: payload,
      muteHttpExceptions: true
    });
  }

  // 4. Ekstraksi Langsung Tanpa Basa-Basi
  var html = res.getContentText();
  var tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) {
    Logger.log("❌ Tag <tbody> Biaya Harian tidak ditemukan!");
    return;
  }

  var trMatches = tbodyMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  if (!trMatches) {
    Logger.log("⚠️ Tidak ada transaksi pada periode tersebut.");
    return;
  }

  var parsedRows = [];

  trMatches.forEach(function(tr) {
    var tdMatches = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
    if (!tdMatches || tdMatches.length < 4) return;

    var tgl = tdMatches[0].replace(/<[^>]+>/g, '').trim();
    var docNo = tdMatches[1].replace(/<[^>]+>/g, '').trim(); 
    var store = tdMatches[2].replace(/<[^>]+>/g, '').trim();
    var total = tdMatches[3].replace(/<[^>]+>/g, '').replace(/,/g, '').trim();

    // 🎯 MATA ELANG V3: Ekstrak Email & Jam dari onclick="viewTrx(...)"
    var rawCell = tdMatches[1];
    var docId = "-", createdBy = "-", trxTime = "-";
    var trxMatch = rawCell.match(/viewTrx\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/i);
    
    if (trxMatch) {
      docId = trxMatch[1].trim();       
      var rawUser = trxMatch[2].trim();   
      createdBy = rawUser.split('/').pop().trim(); // Tebas ID Hash
      trxTime = trxMatch[3].trim();     
    }

    if (tgl !== "" && !tgl.toLowerCase().includes("total")) {
      parsedRows.push([tgl, docNo, store, Number(total) || total, trxTime, createdBy, docId]);
    }
  });

  // 5. Tumpahkan Data ke Spreadsheet
  var headersUI = ["Tanggal", "Nomor Dokumen", "Toko", "Jumlah Total", "Trx Time", "Created By", "Doc ID"];
  sheet.clear();
  sheet.getRange(1, 1, 1, headersUI.length).setValues([headersUI]).setFontWeight("bold").setBackground("#d0e0e3");
  
  if (parsedRows.length > 0) {
    sheet.getRange(2, 1, parsedRows.length, parsedRows[0].length).setValues(parsedRows);
    Logger.log("🎉 BOOM! " + parsedRows.length + " baris Biaya Harian mendarat akurat sesuai tanggal! ⚡");
  } else {
    Logger.log("⚠️ Transaksi kosong pada periode ini.");
  }
  Logger.log("=================================================");
}
