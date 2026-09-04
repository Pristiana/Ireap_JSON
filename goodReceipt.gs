// 📥 RAW DUMP: GOOD RECEIPT (HEADER) + CREATED BY
function RawDump_goodReceipt() {
  Logger.log("=================================================");
  Logger.log("🚀 [GOOD RECEIPT] Menembak laporan Induk Penerimaan Barang...");
  if (!COOKIE_SAKTI) loginCentratireap();

  var f = getGlobalFilter();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabName = "goodreceipt";
  var sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);

// 1. Tembak Halaman Induk Good Receipt (POST Payload Resmi)
  var targetStoreId = (!f.storeId || f.storeId === "ALL" || f.storeId === "") ? "0" : f.storeId;
  var urlInduk = "https://pro.ireappos.com/goodreceipt";
  
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
      "Referer": "https://pro.ireappos.com/goodreceipt"
    },
    payload: payload,
    muteHttpExceptions: true
  });

  if (resInduk.getResponseCode() === 302) {
    Logger.log("⚠️ Sesi mati, ritual login ulang...");
    loginCentratireap();
    return RawDump_goodReceipt();
  }
  
  var html = resInduk.getContentText();
  var tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) {
    Logger.log("❌ Tag <tbody> Good Receipt tidak ditemukan!");
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
    // Halaman Good Receipt punya 8 kolom
    if (!tdMatches || tdMatches.length < 7) return; 

    // Bersihkan teks standar (Sesuai urutan kolom web)
    var store = tdMatches[0].replace(/<[^>]+>/g, '').trim();
    var tgl = tdMatches[1].replace(/<[^>]+>/g, '').trim();
    var supplier = tdMatches[2].replace(/<[^>]+>/g, '').trim();
    var docNo = tdMatches[3].replace(/<[^>]+>/g, '').trim();
    var qty = tdMatches[4].replace(/<[^>]+>/g, '').replace(/,/g, '').trim();
    var retailAmt = tdMatches[5].replace(/<[^>]+>/g, '').replace(/,/g, '').trim();
    var costAmt = tdMatches[6].replace(/<[^>]+>/g, '').replace(/,/g, '').trim();

    // 🎯 MATA ELANG V4: Panen dari onclick="viewGR('ID', 'User')"
    var rawCell = tdMatches[3]; // Posisi tombol ada di kolom ke-4 (Doc No)
    var docId = "-", createdBy = "-";
    
    // Regex menangkap 2 parameter di dalam kurung viewGR()
    var grMatch = rawCell.match(/viewGR\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/i);
    
    if (grMatch) {
      docId = grMatch[1].trim();          // Parameter 1: ID
      
      // ✂️ TEBAS KEPALA ID-NYA! Ambil buntut emailnya doang!
      var rawUser = grMatch[2].trim();   
      createdBy = rawUser.split('/').pop().trim(); 
    }

    // Filter baris totalan atau data kosong
    if (store !== "" && !store.toLowerCase().includes("total")) {
      parsedRows.push([
        store, tgl, supplier, docNo, 
        Number(qty) || qty, 
        Number(retailAmt) || retailAmt, 
        Number(costAmt) || costAmt, 
        createdBy, docId
      ]);
    }
  });

  // 3. Tumpahkan Data ke Spreadsheet
  var headersUI = ["Store", "Date", "Supplier", "Good Receipt No", "Total Qty", "Total Retail Amount IDR", "Total Cost IDR", "Created By", "Doc ID"];
  
  sheet.clear();
  sheet.getRange(1, 1, 1, headersUI.length).setValues([headersUI]).setFontWeight("bold").setBackground("#fff2cc"); // Warna kuning soft biar beda
  
  if (parsedRows.length > 0) {
    sheet.getRange(2, 1, parsedRows.length, parsedRows[0].length).setValues(parsedRows);
    Logger.log("🎉 BOOM! " + parsedRows.length + " baris Good Receipt mendarat dengan kecepatan cahaya! ⚡");
  } else {
    Logger.log("⚠️ Transaksi kosong.");
  }
  Logger.log("=================================================");
}
