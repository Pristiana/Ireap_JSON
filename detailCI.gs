// 💳 TAB: expense/report/detailci (POST PAYLOAD RESMI - MULTI-STORE MERGE)
function RawDump_ExpenseDetailCI() {
  Logger.log("=================================================");
  Logger.log("🚀 [CASH/BANK] Menembak detail CI (Metode POST Payload Resmi)...");
  
  // 1. Kunci Sesi Login
  if (!COOKIE_SAKTI) loginCentratireap();

  var f = getGlobalFilter();
  var defaultHeaders = ["Store", "Date", "Document No.", "Expense Category", "In Amount IDR", "Out Amount IDR", "Balance IDR", "Notes"];

  // 2. Tentukan Cabang
  var targetStores = [];
  if (!f.storeId || f.storeId === "ALL" || f.storeId === "" || f.storeId === "0") {
    targetStores.push({ name: "Emba Sembako & Sayur", id: "78191" });
    targetStores.push({ name: "Emba Sembako & Sayur III", id: "138696" });
  } else {
    targetStores.push({ name: "Cabang Terpilih", id: f.storeId });
  }

  var allRows = [];
  var targetUrl = "https://pro.ireappos.com/expense/report/detailci";

  // 3. Loop Eksekusi POST Tiap Toko
  targetStores.forEach(function(store, index) {
    Logger.log("📡 [" + (index + 1) + "/" + targetStores.length + "] POST payload untuk: " + store.name + " (ID: " + store.id + ")...");
    
    // 🎯 PAYLOAD SAKTI: 100% Sesuai Jeroan Form Asli!
    var payload = {
      "store": store.id,
      "daterange": f.tglAwal + " - " + f.tglAkhir,
      "startdate": f.tglAwal,
      "enddate": f.tglAkhir,
      "filter": "0"
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

    // Auto-login jika sesi expired
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
    if (!tbodyMatch) {
      Logger.log("⚠️ Tag <tbody> tidak ditemukan di cabang: " + store.name);
      return;
    }

    var trMatches = tbodyMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    if (!trMatches) return;

    var storeRowCount = 0;
    trMatches.forEach(function(tr) {
      var tdMatches = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
      // Validasi: Harus minimal 9 kolom (karena ada 1 kolom ghaib tipe transaksi)
      if (!tdMatches || tdMatches.length < 9) return;

      var storeName = tdMatches[0].replace(/<[^>]+>/g, '').trim();
      var tgl       = tdMatches[1].replace(/<[^>]+>/g, '').trim();
      var docNo     = tdMatches[2].replace(/<[^>]+>/g, '').trim();
      
      // ⚠️ tdMatches[3] adalah angka ghaib (1 = CI, 2 = EX), KITA SKIP!
      
      var category  = tdMatches[4].replace(/<[^>]+>/g, '').trim();
      var inAmt     = tdMatches[5].replace(/<[^>]+>/g, '').replace(/,/g, '').trim();
      var outAmt    = tdMatches[6].replace(/<[^>]+>/g, '').replace(/,/g, '').trim();
      var balance   = tdMatches[7].replace(/<[^>]+>/g, '').replace(/,/g, '').trim();
      var notes     = tdMatches[8].replace(/<[^>]+>/g, '').trim(); // 🎯 Notes asli terselamatkan!

      // Filter baris sampah "Beginning Balance" dan "Total IDR"
      if (storeName !== "" && !storeName.toLowerCase().includes("beginning") && !category.toLowerCase().includes("total idr")) {
        allRows.push([
          storeName, tgl, docNo, category,
          Number(inAmt) || inAmt,
          Number(outAmt) || outAmt,
          Number(balance) || balance,
          notes
        ]);
        storeRowCount++;
      }
    });
    
    Logger.log("✅ Ditemukan " + storeRowCount + " baris valid dari " + store.name);
  });

  // 4. Tumpahkan Data Bersih ke Spreadsheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("expense/report/detailci") || ss.insertSheet("expense/report/detailci");
  
  sheet.clear();
  sheet.getRange(1, 1, 1, defaultHeaders.length).setValues([defaultHeaders]).setFontWeight("bold").setBackground("#d9ead3");

  if (allRows.length > 0) {
    sheet.getRange(2, 1, allRows.length, allRows[0].length).setValues(allRows);
    Logger.log("🎉 BOOM! Sukses mendaratkan total " + allRows.length + " baris Cash/Bank akurat! ⚡");
  } else {
    Logger.log("⚠️ Transaksi Cash/Bank kosong pada periode ini.");
  }
  Logger.log("=================================================");
}
