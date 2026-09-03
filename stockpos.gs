// 🚚 TAB: stockpos (SUPPORT SINGLE CABANG & AUTO-LOOP ALL STORE)
function RawDump_Stockpos() {
  Logger.log("=================================================");
  Logger.log("🚀 [RAW DUMP] Memproses tab: [stockpos]...");
  if (!COOKIE_SAKTI) loginCentratireap();

  var f = getGlobalFilter();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("stockpos") || ss.insertSheet("stockpos");

  // 🎯 Tentukan antrean cabang dengan nama resmi iREAP
  var targetStores = [];
  if (PILIH_TOKO === "ALL") {
    Logger.log("🔄 Mode ALL: Mengantrekan penarikan Emba Sembako & Sayur & Emba Sembako & Sayur III...");
    targetStores.push({ name: "Emba Sembako & Sayur", id: "78191" });
    targetStores.push({ name: "Emba Sembako & Sayur III", id: "138696" });
  } else if (PILIH_TOKO === "Emba Sembako & Sayur" || PILIH_TOKO === "EMBA_1") {
    targetStores.push({ name: "Emba Sembako & Sayur", id: "78191" });
  } else if (PILIH_TOKO === "Emba Sembako & Sayur III" || PILIH_TOKO === "EMBA_3") {
    targetStores.push({ name: "Emba Sembako & Sayur III", id: "138696" });
  }

  var allRows = [];
  var headersUI = ["Store", "Item Code", "Description", "Start Qty", "Issued", "Receipt", "Sold", "Returned", "Transfer In", "Transfer Out", "End Qty"];

  var apiHeaders = { 
    "User-Agent": HEADERS_TOPENG["User-Agent"], 
    "Cookie": COOKIE_SAKTI, 
    "X-Requested-With": "XMLHttpRequest", 
    "Accept": "application/json, text/javascript, */*; q=0.01", 
    "Referer": "https://pro.ireappos.com/stockpos" 
  };

  var payloadDataTables = JSON.stringify({
    "draw": 1,
    "columns": [
      { "data": "article.itemCode", "name": "Item Code", "searchable": true, "orderable": true, "search": { "value": "", "regex": false } },
      { "data": "article.description", "name": "Description", "searchable": true, "orderable": true, "search": { "value": "", "regex": false } },
      { "data": "startQty", "name": "START Quantity", "searchable": true, "orderable": false, "search": { "value": "", "regex": false } },
      { "data": "issuedQty", "name": "Issued", "searchable": true, "orderable": false, "search": { "value": "", "regex": false } },
      { "data": "receiptQty", "name": "Receipt", "searchable": true, "orderable": false, "search": { "value": "", "regex": false } },
      { "data": "saleQty", "name": "Sold", "searchable": true, "orderable": false, "search": { "value": "", "regex": false } },
      { "data": "returnQty", "name": "Returned", "searchable": true, "orderable": false, "search": { "value": "", "regex": false } },
      { "data": "tinQty", "name": "Transfered In", "searchable": true, "orderable": false, "search": { "value": "", "regex": false } },
      { "data": "toutQty", "name": "Transfered Out", "searchable": true, "orderable": false, "search": { "value": "", "regex": false } },
      { "data": "endQty", "name": "END Quantity", "searchable": true, "orderable": false, "search": { "value": "", "regex": false } }
    ],
    "order": [ { "column": 1, "dir": "asc" } ],
    "start": 0,
    "length": 10000, 
    "search": { "value": "", "regex": false }
  });

  // Eksekusi penembakan per toko
  targetStores.forEach(function(store) {
    Logger.log("📡 Menembak mutasi stok untuk cabang: [" + store.name + "] (ID: " + store.id + ")...");
    var url = "https://pro.ireappos.com/stockpos/datatable?storeid=" + store.id + "&startdate=" + f.tglAwal + "&enddate=" + f.tglAkhir + "&excludezero=false&excludedeleted=true";

    var res = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: payloadDataTables,
      headers: apiHeaders,
      muteHttpExceptions: true
    });

    var rawText = res.getContentText();
    if (!rawText.trim().startsWith("{")) {
      Logger.log("⚠️ Respon untuk " + store.name + " bukan JSON valid! Lewati...");
      return;
    }

    var dataJSON = JSON.parse(rawText);
    var items = dataJSON.data || [];
    Logger.log("📦 Ditemukan " + items.length + " baris data dari " + store.name);

    items.forEach(function(item) {
      allRows.push([
        store.name,
        item.article ? item.article.itemCode : "",
        item.article ? item.article.description : "",
        item.startQty || 0,
        item.issuedQty || 0,
        item.receiptQty || 0,
        item.saleQty || 0,
        item.returnQty || 0,
        item.tinQty || 0,
        item.toutQty || 0,
        item.endQty || 0
      ]);
    });
  });

  // Tulis ke tab stockpos
  sheet.clear();
  sheet.getRange(1, 1, 1, headersUI.length).setValues([headersUI]).setFontWeight("bold").setBackground("#d9ead3");
  
  if (allRows.length > 0) {
    sheet.getRange(2, 1, allRows.length, allRows[0].length).setValues(allRows);
    Logger.log("🎉 BOOM! Total " + allRows.length + " baris mutasi stok berhasil mendarat!");
  } else {
    Logger.log("⚠️ Data mutasi kosong pada periode yang dipilih.");
  }
  Logger.log("=================================================");
}
