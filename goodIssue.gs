// 📤 RAW DUMP: GOOD ISSUE (HEADER) + CREATED BY
function RawDump_goodIssue() {
  Logger.log("=================================================");
  Logger.log("🚀 [GOOD ISSUE] Menembak laporan Induk Pengeluaran Barang...");
  if (!COOKIE_SAKTI) loginCentratireap();

  var f = getGlobalFilter();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabName = "goodissue";
  var sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);

  // 1. Tembak Halaman Induk Good Issue (POST Payload Resmi)
  var targetStoreId = (!f.storeId || f.storeId === "ALL" || f.storeId === "") ? "0" : f.storeId;
  var urlInduk = "https://pro.ireappos.com/goodissue";
  
  var payload = {
    "store": targetStoreId,
    "daterange": f.tglAwal + " - " + f.tglAkhir,
    "startdate": f.tglAwal,
    "enddate": f.tglAkhir
  };

  var resInduk = UrlFetchApp.fetch(urlInduk, {
    method: "post",
    headers: {
      "User-Agent": HEADERS_TOPENG["User-Agent"],
      "Cookie": COOKIE_SAKTI,
      "Referer": "https://pro.ireappos.com/goodissue"
    },
    payload: payload,
    muteHttpExceptions: true
  });

  if (resInduk.getResponseCode() === 302) {
    Logger.log("⚠️ Sesi mati, ritual login ulang...");
    loginCentratireap();
    return RawDump_goodIssue();
  }

  if (resInduk.getResponseCode() === 302) {
    Logger.log("⚠️ Sesi mati, ritual login ulang...");
    loginCentratireap();
    return RawDump_GoodIssue();
  }

  var html = resInduk.getContentText();
  var tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) {
    Logger.log("❌ Tag <tbody> Good Issue tidak ditemukan!");
    return;
  }

  var trMatches = tbodyMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  if (!trMatches || trMatches.length === 0) {
    Logger.log("⚠️ Tidak ada transaksi pada periode tersebut.");
    return;
  }

  // 2. Ekstraksi Cepat Jalur Darat
  var parsedRows = [];

  trMatches.forEach(function(tr) {
    var tdMatches = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
    
    // Good Issue punya tepat 7 kolom
    if (!tdMatches || tdMatches.length < 7) return; 

    // Bersihkan teks standar (Sesuai urutan kolom web)
    var store = tdMatches[0].replace(/<[^>]+>/g, '').trim();
    var tgl = tdMatches[1].replace(/<[^>]+>/g, '').trim();
    var reason = tdMatches[2].replace(/<[^>]+>/g, '').trim(); // Bisa "Reset", "Rusak", dll
    var docNo = tdMatches[3].replace(/<[^>]+>/g, '').trim();
    var qty = tdMatches[4].replace(/<[^>]+>/g, '').replace(/,/g, '').trim();
    var amount = tdMatches[5].replace(/<[^>]+>/g, '').replace(/,/g, '').trim();
    var cost = tdMatches[6].replace(/<[^>]+>/g, '').replace(/,/g, '').trim();

    // 🎯 MATA ELANG V5: Panen dari onclick="viewGI('ID', 'User')"
    var rawCell = tdMatches[3]; // Tombolnya ngumpet di kolom ke-4
    var docId = "-", createdBy = "-";
    
    // Regex menangkap 2 parameter dari fungsi viewGI()
    var giMatch = rawCell.match(/viewGI\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/i);
    
    if (giMatch) {
      docId = giMatch[1].trim();          
      
      // ✂️ TEBAS KEPALA HASH EMAIL
      var rawUser = giMatch[2].trim();   
      createdBy = rawUser.split('/').pop().trim(); 
    }

    // Hindari baris Total terbawa masuk
    if (store !== "" && !store.toLowerCase().includes("total")) {
      parsedRows.push([
        store, tgl, reason, docNo, 
        Number(qty) || qty, 
        Number(amount) || amount, 
        Number(cost) || cost, 
        createdBy, docId
      ]);
    }
  });

  // 3. Tumpahkan Data ke Spreadsheet
  var headersUI = ["Store", "Date", "Reason/Supplier", "Good Issue No", "Total Qty", "Total Amount IDR", "Total Cost IDR", "Created By", "Doc ID"];
  
  sheet.clear();
  // Warna coral/merah pudar biar beda vibe sama receipt
  sheet.getRange(1, 1, 1, headersUI.length).setValues([headersUI]).setFontWeight("bold").setBackground("#f4cccc"); 
  
  if (parsedRows.length > 0) {
    sheet.getRange(2, 1, parsedRows.length, parsedRows[0].length).setValues(parsedRows);
    Logger.log("🎉 BOOM! " + parsedRows.length + " baris Good Issue sukses mendarat sekilat petir! ⚡");
  } else {
    Logger.log("⚠️ Transaksi kosong.");
  }
  Logger.log("=================================================");
}
