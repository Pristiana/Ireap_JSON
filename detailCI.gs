// 💳 RAW DUMP: CASH/BANK DETAIL (MULTI-STORE LOOP + INJECT KASIR DARI DAILY EXPENSE)
function RawDump_ExpenseDetailCI() {
  Logger.log("=================================================");
  Logger.log("🚀 [DETAIL CI] Menembak Arus Kas & Bank + Inject Kasir...");
  
  if (!COOKIE_SAKTI) loginCentratireap();

  var f = getGlobalFilter();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabName = "expense/report/detailci";
  var sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);

  // 🧠 1. VLOOKUP GAIB KOMPOSIT: Sedot Kamus Kasir dari Sheet Daily Expense ("expense/report/daily")
  var mapKasir = {};
  var sheetDaily = ss.getSheetByName("expense/report/daily");
  if (sheetDaily) {
    var dataDaily = sheetDaily.getDataRange().getValues();
    if (dataDaily.length > 1) {
      var headerDaily = dataDaily[0];
      var idxStore = -1, idxDoc = -1, idxKasir = -1;
      
      for (var h = 0; h < headerDaily.length; h++) {
        var hName = headerDaily[h].toString().trim();
        if (hName === "Toko") idxStore = h;
        if (hName === "Nomor Dokumen") idxDoc = h;
        if (hName === "Created By") idxKasir = h;
      }
      
      if (idxStore > -1 && idxDoc > -1 && idxKasir > -1) {
        for (var i = 1; i < dataDaily.length; i++) {
          var storeName = dataDaily[i][idxStore] ? dataDaily[i][idxStore].toString().trim() : "";
          var noDokumen = dataDaily[i][idxDoc] ? dataDaily[i][idxDoc].toString().trim() : "";
          var createdBy = dataDaily[i][idxKasir];
          
          if (storeName && noDokumen) {
            var compositeKey = storeName + "_" + noDokumen;
            mapKasir[compositeKey] = createdBy;
          }
        }
        Logger.log("🧠 Kamus Komposit Kasir DetailCI Berhasil Dirajut! (" + Object.keys(mapKasir).length + " referensi)");
      } else {
        Logger.log("⚠️ Gagal bikin kamus: Kolom Toko / Nomor Dokumen / Created By tidak klop di sheet daily!");
      }
    }
  }

  // 2. Tentukan Antrean Cabang (Emba 1 & Emba 3)
  var targetStores = [];
  if (!f.storeId || f.storeId === "ALL" || f.storeId === "" || f.storeId === "0") {
    targetStores.push({ name: "Emba Sembako & Sayur", id: "78191" });
    targetStores.push({ name: "Emba Sembako & Sayur III", id: "138696" });
  } else {
    targetStores.push({ name: "Cabang Terpilih", id: f.storeId });
  }

  var allRows = [];

  // 3. Loop Fetch per Cabang
  targetStores.forEach(function(store, index) {
    Logger.log("📡 [" + (index + 1) + "/" + targetStores.length + "] Menarik Detail CI: " + store.name + " (ID: " + store.id + ")...");
    
    var targetUrl = "https://pro.ireappos.com/expense/report/detailci";
    var payload = {
      "store": store.id,
      "daterange": f.tglAwal + " - " + f.tglAkhir,
      "startdate": f.tglAwal,
      "enddate": f.tglAkhir
    };

    var res = UrlFetchApp.fetch(targetUrl, {
      method: "post",
      headers: {
        "User-Agent": HEADERS_TOPENG["User-Agent"],
        "Cookie": COOKIE_SAKTI,
        "Referer": "https://pro.ireappos.com/expense/report/detailci"
      },
      payload: payload,
      muteHttpExceptions: true
    });

    if (res.getResponseCode() === 302) {
      Logger.log("⚠️ Sesi mati, login ulang...");
      loginCentratireap();
      res = UrlFetchApp.fetch(targetUrl, {
        method: "post",
        headers: {
          "User-Agent": HEADERS_TOPENG["User-Agent"],
          "Cookie": COOKIE_SAKTI,
          "Referer": "https://pro.ireappos.com/expense/report/detailci"
        },
        payload: payload,
        muteHttpExceptions: true
      });
    }

    var html = res.getContentText();
    var tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
    if (!tbodyMatch) return;

    var trMatches = tbodyMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    if (!trMatches) return;

    trMatches.forEach(function(tr) {
      var tdMatches = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
      if (!tdMatches || tdMatches.length < 9) return;

      var storeName = tdMatches[0].replace(/<[^>]+>/g, '').trim();
      var tgl       = tdMatches[1].replace(/<[^>]+>/g, '').trim();
      var docNo     = tdMatches[2].replace(/<[^>]+>/g, '').trim();
      
      // tdMatches[3] adalah angka ghaib (1 = CI, 2 = EX), kita skip!
      var category  = tdMatches[4].replace(/<[^>]+>/g, '').trim();
      var inAmt     = tdMatches[5].replace(/<[^>]+>/g, '').replace(/,/g, '').trim();
      var outAmt    = tdMatches[6].replace(/<[^>]+>/g, '').replace(/,/g, '').trim();
      var balance   = tdMatches[7].replace(/<[^>]+>/g, '').replace(/,/g, '').trim();
      var notes     = tdMatches[8].replace(/<[^>]+>/g, '').trim();

      if (storeName !== "" && !storeName.toLowerCase().includes("beginning") && !category.toLowerCase().includes("total idr")) {
        
        // 💉 VLOOKUP GAIB KOMPOSIT (Store + DocNo)
        var compositeKey = storeName + "_" + docNo;
        var kasirPenanggungJawab = mapKasir[compositeKey] || "Tidak Ditemukan";

        allRows.push([
          storeName, tgl, docNo, category,
          Number(inAmt) || inAmt,
          Number(outAmt) || outAmt,
          Number(balance) || balance,
          notes,
          kasirPenanggungJawab // Kolom ke-9: Created By
        ]);
      }
    });
  });

  // 4. Tumpahkan Data ke Spreadsheet (Tambah Kolom Created By)
  var headersUI = ["Store", "Date", "Document No.", "Expense Category", "In Amount IDR", "Out Amount IDR", "Balance IDR", "Notes", "Created By"];
  sheet.clear();
  sheet.getRange(1, 1, 1, headersUI.length).setValues([headersUI]).setFontWeight("bold").setBackground("#d0e0e3");
  
  if (allRows.length > 0) {
    sheet.getRange(2, 1, allRows.length, allRows[0].length).setValues(allRows);
    Logger.log("🎉 BOOM! " + allRows.length + " baris Detail CI sukses disuntik Kasir dari Daily Expense!");
  } else {
    Logger.log("⚠️ Transaksi Cash/Bank kosong pada periode ini.");
  }
  Logger.log("=================================================");
}
