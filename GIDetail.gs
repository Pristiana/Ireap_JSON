// 📦 RAW DUMP: GI DETAIL (HYBRID SUPPLIER + INJECT CREATED BY)
function RawDump_GIDetail() {
  Logger.log("=================================================");
  Logger.log("🚀 [GI DETAIL] Menembak Rincian Pengeluaran + Note + Supplier + Kasir...");
  
  if (!COOKIE_SAKTI) loginCentratireap();

  var f = getGlobalFilter();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabName = "gidetail";
  var sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);

  // 🧠 1. VLOOKUP GAIB KOMPOSIT: Sedot Kamus dari goodissue
  var mapHeader = {};
  var sheetInduk = ss.getSheetByName("goodissue");
  if (sheetInduk) {
    var dataInduk = sheetInduk.getDataRange().getValues();
    if (dataInduk.length > 1) {
      var headerInduk = dataInduk[0];
      var idxStore = -1, idxDoc = -1, idxKasir = -1, idxReason = -1;
      
      for (var h = 0; h < headerInduk.length; h++) {
        var hName = headerInduk[h].toString().trim();
        if (hName === "Store") idxStore = h;
        if (hName === "Good Issue No" || hName === "Good Issue No.") idxDoc = h;
        if (hName === "Created By") idxKasir = h;
        if (hName === "Reason/Supplier" || hName === "Supplier") idxReason = h;
      }
      
      if (idxStore > -1 && idxDoc > -1) {
        for (var i = 1; i < dataInduk.length; i++) {
          var storeName = dataInduk[i][idxStore] ? dataInduk[i][idxStore].toString().trim() : "";
          var noDokumen = dataInduk[i][idxDoc] ? dataInduk[i][idxDoc].toString().trim() : "";
          var createdBy = idxKasir > -1 ? dataInduk[i][idxKasir] : "-";
          var reasonVal = idxReason > -1 ? dataInduk[i][idxReason] : "-";
          
          if (storeName && noDokumen) {
            mapHeader[storeName + "_" + noDokumen] = {
              kasir: createdBy,
              reason: reasonVal
            };
          }
        }
      }
    }
  }

  // 2. Tembak POST
  var targetStoreId = (!f.storeId || f.storeId === "ALL" || f.storeId === "") ? "0" : f.storeId;
  var targetUrl = "https://pro.ireappos.com/gidetail";

  var payload = {
    "store": targetStoreId,
    "daterange": f.tglAwal + " - " + f.tglAkhir,
    "startdate": f.tglAwal,
    "enddate": f.tglAkhir,
    "category": "0",
    "itemName": ""
  };

  var res = UrlFetchApp.fetch(targetUrl, {
    method: "post",
    headers: {
      "User-Agent": HEADERS_TOPENG["User-Agent"],
      "Cookie": COOKIE_SAKTI,
      "Referer": "https://pro.ireappos.com/gidetail"
    },
    payload: payload,
    muteHttpExceptions: true
  });

  if (res.getResponseCode() === 302) {
    loginCentratireap();
    return RawDump_GIDetail();
  }

  var html = res.getContentText();
  var tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return;

  var trMatches = tbodyMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  if (!trMatches) return;

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
    
    var note      = tdMatches[10] ? tdMatches[10].replace(/<[^>]+>/g, '').trim() : "";
    var supplier  = tdMatches[11] ? tdMatches[11].replace(/<[^>]+>/g, '').trim() : "";

    if (storeName !== "" && !itemName.toLowerCase().includes("total idr")) {
      var compositeKey = storeName + "_" + docNo;
      var headerInfo = mapHeader[compositeKey] || { kasir: "Tidak Ditemukan", reason: "-" };

      // Kalau kolom supplier di HTML detail kosong, ambil dari header!
      var finalSupplier = supplier !== "" ? supplier : headerInfo.reason;

      parsedRows.push([
        storeName, tgl, docNo, Number(lineNo) || lineNo, itemCode, itemName, 
        Number(qty) || qty, uom, Number(amount) || amount, Number(cost) || cost,
        note, finalSupplier, headerInfo.kasir
      ]);
    }
  });

  // 4. Tumpahkan Data (Total 13 Kolom)
  var headersUI = [
    "Store", "Date", "Good Issue No.", "Line No.", "Item Code", "Item Name", 
    "Qty", "UoM", "Amount IDR", "Cost IDR", "Note", "Supplier/Reason", "Created By"
  ];
  sheet.clear();
  sheet.getRange(1, 1, 1, headersUI.length).setValues([headersUI]).setFontWeight("bold").setBackground("#f4cccc"); 
  
  if (parsedRows.length > 0) {
    sheet.getRange(2, 1, parsedRows.length, parsedRows[0].length).setValues(parsedRows);
    Logger.log("🎉 BOOM! " + parsedRows.length + " baris GI Detail sukses disedot beserta Note & Supplier!");
  }
  Logger.log("=================================================");
}
