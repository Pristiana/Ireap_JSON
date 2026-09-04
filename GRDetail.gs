// 📥 RAW DUMP: GOOD RECEIPT DETAIL (POST PAYLOAD RESMI - SAPU JAGAT)
function RawDump_GRDetail() {
  Logger.log("=================================================");
  Logger.log("🚀 [GR DETAIL] Menembak Rincian Penerimaan Barang...");
  
  if (!COOKIE_SAKTI) loginCentratireap();

  var f = getGlobalFilter();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabName = "grdetail";
  var sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);

  // 1. Siapkan Parameter Sapu Jagat (0 = ALL Store)
  var targetStoreId = (!f.storeId || f.storeId === "ALL" || f.storeId === "") ? "0" : f.storeId;
  Logger.log("🎯 Filter Aktif -> Toko: " + (targetStoreId === "0" ? "ALL (0)" : targetStoreId) + " | Rentang: " + f.tglAwal + " s/d " + f.tglAkhir);

  var targetUrl = "https://pro.ireappos.com/grdetail";

  // 🎯 PAYLOAD RESMI HASIL X-RAY
  var payload = {
    "store": targetStoreId,
    "daterange": f.tglAwal + " - " + f.tglAkhir,
    "startdate": f.tglAwal,
    "enddate": f.tglAkhir,
    "category": "0", // 0 = Semua Kategori
    "itemName": ""   // Kosong = Semua Barang
  };

  // 2. Tembak POST
  var res = UrlFetchApp.fetch(targetUrl, {
    method: "post",
    headers: {
      "User-Agent": HEADERS_TOPENG["User-Agent"],
      "Cookie": COOKIE_SAKTI,
      "Referer": "https://pro.ireappos.com/grdetail"
    },
    payload: payload,
    muteHttpExceptions: true
  });

  // Handle jebakan sesi mati (HTTP 302)
  if (res.getResponseCode() === 302) {
    Logger.log("⚠️ Sesi mati, ritual login ulang...");
    loginCentratireap();
    res = UrlFetchApp.fetch(targetUrl, {
      method: "post",
      headers: {
        "User-Agent": HEADERS_TOPENG["User-Agent"],
        "Cookie": COOKIE_SAKTI,
        "Referer": "https://pro.ireappos.com/grdetail"
      },
      payload: payload,
      muteHttpExceptions: true
    });
  }

  // 3. Ekstraksi Data (10 Kolom)
  var html = res.getContentText();
  var tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) {
    Logger.log("❌ Tag <tbody> GR Detail tidak ditemukan!");
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
    if (!tdMatches || tdMatches.length < 10) return;

    var storeName = tdMatches[0].replace(/<[^>]+>/g, '').trim();
    var tgl       = tdMatches[1].replace(/<[^>]+>/g, '').trim();
    var docNo     = tdMatches[2].replace(/<[^>]+>/g, '').trim();
    var lineNo    = tdMatches[3].replace(/<[^>]+>/g, '').trim();
    var itemCode  = tdMatches[4].replace(/<[^>]+>/g, '').trim();
    var itemName  = tdMatches[5].replace(/<[^>]+>/g, '').trim();
    var qty       = tdMatches[6].replace(/<[^>]+>/g, '').replace(/,/g, '').trim();
    var uom       = tdMatches[7].replace(/<[^>]+>/g, '').trim();
    var amount    = tdMatches[8].replace(/<[^>]+>/g, '').replace(/,/g, '').trim();
    var cost      = tdMatches[9].replace(/<[^>]+>/g, '').replace(/,/g, '').trim();

    // 🧹 Buang baris summary "Total IDR"
    if (storeName !== "" && !itemName.toLowerCase().includes("total idr")) {
      parsedRows.push([
        storeName, tgl, docNo, Number(lineNo) || lineNo, itemCode, itemName, 
        Number(qty) || qty, uom, Number(amount) || amount, Number(cost) || cost
      ]);
    }
  });

  // 4. Tumpahkan Data ke Spreadsheet
  var headersUI = ["Store", "Date", "Good Receipt No.", "Line No.", "Item Code", "Item Name", "Qty", "UoM", "Amount IDR", "Cost IDR"];
  sheet.clear();
  sheet.getRange(1, 1, 1, headersUI.length).setValues([headersUI]).setFontWeight("bold").setBackground("#cfe2f3"); // Biru lembut penerimaan barang
  
  if (parsedRows.length > 0) {
    sheet.getRange(2, 1, parsedRows.length, parsedRows[0].length).setValues(parsedRows);
    Logger.log("🎉 BOOM! " + parsedRows.length + " baris GR Detail sukses disedot sekilat petir! ⚡");
  } else {
    Logger.log("⚠️ Transaksi kosong pada periode ini.");
  }
  Logger.log("=================================================");
}
