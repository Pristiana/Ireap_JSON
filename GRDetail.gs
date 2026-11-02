// 📥 RAW DUMP: GOOD RECEIPT DETAIL (UTUH - SUNTIK SUPPLIER, NOTE BERSIH & CREATED BY)
function RawDump_GRDetail() {
  Logger.log("=================================================");
  Logger.log("🚀 [GR DETAIL] Menembak Rincian Penerimaan Barang...");
  
  if (!COOKIE_SAKTI) loginCentratireap();

  var f = getGlobalFilter();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabName = "grdetail";
  var sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);

  // 🧠 1. VLOOKUP GAIB KOMPOSIT: Sedot Kamus Supplier & Kasir dari goodreceipt
  var mapHeader = {};
  var sheetInduk = ss.getSheetByName("goodreceipt");
  if (sheetInduk) {
    var dataInduk = sheetInduk.getDataRange().getValues();
    if (dataInduk.length > 1) {
      var headerInduk = dataInduk[0];
      var idxStore = -1, idxDoc = -1, idxKasir = -1, idxSupplier = -1;
      
      for (var h = 0; h < headerInduk.length; h++) {
        var hName = headerInduk[h].toString().trim();
        if (hName === "Store") idxStore = h;
        if (hName === "Good Receipt No" || hName === "Good Receipt No.") idxDoc = h;
        if (hName === "Created By") idxKasir = h;
        if (hName === "Supplier") idxSupplier = h;
      }
      
      if (idxStore > -1 && idxDoc > -1) {
        for (var i = 1; i < dataInduk.length; i++) {
          var storeName = dataInduk[i][idxStore] ? dataInduk[i][idxStore].toString().trim() : "";
          var noDokumen = dataInduk[i][idxDoc] ? dataInduk[i][idxDoc].toString().trim() : "";
          var createdBy = idxKasir > -1 ? dataInduk[i][idxKasir] : "-";
          var supplierVal = idxSupplier > -1 ? dataInduk[i][idxSupplier] : "-";
          
          if (storeName && noDokumen) {
            mapHeader[storeName + "_" + noDokumen] = {
              kasir: createdBy,
              supplier: supplierVal
            };
          }
        }
        Logger.log("🧠 Kamus GR berhasil dirajut! (" + Object.keys(mapHeader).length + " referensi)");
      }
    }
  }

  // 2. Siapkan Parameter Sapu Jagat (0 = ALL Store)
  var targetStoreId = (!f.storeId || f.storeId === "ALL" || f.storeId === "") ? "0" : f.storeId;
  Logger.log("🎯 Filter Aktif -> Toko: " + (targetStoreId === "0" ? "ALL (0)" : targetStoreId) + " | Rentang: " + f.tglAwal + " s/d " + f.tglAkhir);

  var targetUrl = "https://pro.ireappos.com/grdetail";

  var payload = {
    "store": targetStoreId,
    "daterange": f.tglAwal + " - " + f.tglAkhir,
    "startdate": f.tglAwal,
    "enddate": f.tglAkhir,
    "category": "0", 
    "itemName": ""   
  };

  // Tembak POST
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

  // 3. Ekstraksi Data HTML Transaksi
  var html = res.getContentText();

  var allTbodies = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/gi);
  if (!allTbodies) {
    Logger.log("❌ Tag <tbody> GR Detail tidak ditemukan!");
    return;
  }

  var targetTbody = "";
  for (var t = 0; t < allTbodies.length; t++) {
    if (allTbodies[t].indexOf("G202") > -1 || allTbodies[t].indexOf("Total IDR") > -1 || allTbodies[t].indexOf("Emba") > -1) {
      targetTbody = allTbodies[t];
      break;
    }
  }

  if (!targetTbody) {
    targetTbody = allTbodies[allTbodies.length - 1];
  }

  var trMatches = targetTbody.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
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

    // Kolom ke-10 (Note) & Kolom ke-11 (Supplier jika ada di web)
    var rawNote     = tdMatches[10] ? tdMatches[10].replace(/<[^>]+>/g, '').trim() : "";
    var webSupplier = tdMatches[11] ? tdMatches[11].replace(/<[^>]+>/g, '').trim() : "";

    // 🧹 Bersihkan sampah tombol 'Show' / link bawaan web
    var webNote = "";
    if (rawNote.toLowerCase() !== "show" && 
        rawNote.toLowerCase() !== "view" && 
        rawNote !== "-" && 
        !rawNote.toLowerCase().includes("show note")) {
      webNote = rawNote;
    }

    // Buang baris summary "Total IDR", baris dropdown "Show entries", atau baris kosong
    var isJunk = storeName.toLowerCase().includes("show") ||
                 storeName.toLowerCase().includes("total idr") || 
                 itemName.toLowerCase().includes("total idr") ||
                 storeName === "" || docNo === "";

    if (!isJunk) {
      var compositeKey = storeName + "_" + docNo;
      var headerInfo = mapHeader[compositeKey] || { kasir: "Tidak Ditemukan", supplier: "-" };

      var finalSupplier = (webSupplier !== "" && webSupplier !== "-") ? webSupplier : headerInfo.supplier;

      parsedRows.push([
        storeName,
        tgl,
        docNo,
        Number(lineNo) || lineNo,
        itemCode,
        itemName, 
        Number(qty) || qty,
        uom,
        Number(amount) || amount,
        Number(cost) || cost,
        webNote,
        finalSupplier,
        headerInfo.kasir
      ]);
    }
  });

  // 4. Tumpahkan Data ke Spreadsheet
  var headersUI = [
    "Store", "Date", "Good Receipt No.", "Line No.", "Item Code", "Item Name", 
    "Qty", "UoM", "Amount IDR", "Cost IDR", "Note", "Supplier", "Created By"
  ];
  sheet.clear();
  sheet.getRange(1, 1, 1, headersUI.length).setValues([headersUI]).setFontWeight("bold").setBackground("#cfe2f3");
  
  if (parsedRows.length > 0) {
    sheet.getRange(2, 1, parsedRows.length, parsedRows[0].length).setValues(parsedRows);
    Logger.log("🎉 BOOM! " + parsedRows.length + " baris GR Detail sukses disedot bersih!");
  } else {
    Logger.log("⚠️ Transaksi kosong pada periode ini.");
  }
  Logger.log("=================================================");
}
