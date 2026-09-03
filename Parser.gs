

// ====================================================================
// 🛠️ HELPER PARAMETER FILTER GLOBAL
// ====================================================================
function getGlobalFilter() {
  var tz = Session.getScriptTimeZone();
  var d = new Date();
  var storeId = STORE_ID_MAP[PILIH_TOKO] || "";

  var tglAwal = MANUAL_START_DATE;
  var tglAkhir = MANUAL_END_DATE;

  if (!tglAwal || !tglAkhir) {
    var dAwal = new Date();
    dAwal.setDate(d.getDate() - HARI_MUNDUR);
    tglAwal = Utilities.formatDate(dAwal, tz, "yyyy/MM/dd");

    var dAkhir = new Date();
    // Kalau cuma 1 hari (kemarin saja)
    if (HARI_MUNDUR === 1) {
      dAkhir.setDate(d.getDate() - 1);
    }
    tglAkhir = Utilities.formatDate(dAkhir, tz, "yyyy/MM/dd");
  }

  Logger.log("🎯 [FILTER AKTIF] Toko: " + PILIH_TOKO + " (ID: " + (storeId || "Semua Toko") + ") | Rentang: " + tglAwal + " s/d " + tglAkhir);
  return { storeId: storeId, tglAwal: tglAwal, tglAkhir: tglAkhir };
}

// 🌐 ENGINE PARSER HTML RAW (UNTUK gidetail, grdetail, expense, article)
function dumpGenericHTML(tabName, relativeUrl, defaultHeaders) {
  Logger.log("=================================================");
  Logger.log("🚀 [RAW DUMP] Memproses tab: [" + tabName + "]...");
  if (!COOKIE_SAKTI) loginCentratireap();

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);
  var targetUrl = "https://pro.ireappos.com" + relativeUrl;

  var res = UrlFetchApp.fetch(targetUrl, {
    method: "get",
    headers: {
      "User-Agent": HEADERS_TOPENG["User-Agent"],
      "Cookie": COOKIE_SAKTI,
      "Referer": targetUrl
    },
    muteHttpExceptions: true
  });

  if (res.getResponseCode() === 302) {
    Logger.log("⚠️ Sesi kedaluwarsa (302). Login ulang...");
    loginCentratireap();
    return dumpGenericHTML(tabName, relativeUrl, defaultHeaders);
  }

  var html = res.getContentText();

  // 1. Tangkap Header Otomatis dari <thead>
  var tableHeaders = [];
  var theadMatch = html.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
  if (theadMatch) {
    var thMatches = theadMatch[1].match(/<th[^>]*>([\s\S]*?)<\/th>/gi);
    if (thMatches) {
      tableHeaders = thMatches.map(function(th) {
        return th.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      }).filter(function(text) { return text !== ""; });
    }
  }

  if (tableHeaders.length === 0) tableHeaders = defaultHeaders;

  // 2. Tangkap Seluruh Baris dari <tbody>
  var tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) {
    Logger.log("❌ Tag <tbody> tidak ditemukan di tab [" + tabName + "]!");
    return;
  }

  var trMatches = tbodyMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  if (!trMatches || trMatches.length === 0) {
    Logger.log("⚠️ <tbody> kosong pada periode tersebut.");
    return;
  }

  var rows = [];
  trMatches.forEach(function(tr) {
    var tdMatches = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
    if (tdMatches) {
      var rowData = tdMatches.map(function(td) {
        return td.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      });
      // Filter baris totalan bawah atau baris kosong melompong
      var barisTeks = rowData.join(" ").toLowerCase();
      if (rowData.length > 0 && rowData[0] !== "" && !barisTeks.includes("total idr")) {
        rows.push(rowData);
      }
    }
  });

  Logger.log("📦 Berhasil mengekstrak " + rows.length + " baris data!");

  if (rows.length > 0) {
    sheet.clear();
    sheet.getRange(1, 1, 1, tableHeaders.length).setValues([tableHeaders]).setFontWeight("bold").setBackground("#cfe2f3");
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    Logger.log("🎉 BOOM! Mendaratkan " + rows.length + " baris ke tab [" + tabName + "]!");
  }
}
