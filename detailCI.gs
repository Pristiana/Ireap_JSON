// 💳 TAB: expense/report/detailci (MULTI-STORE SUCK ALL & MERGE)
function RawDump_ExpenseDetailCI() {
  Logger.log("=================================================");
  Logger.log("🚀 [CASH/BANK] Menembak detail CI (Multi-Store Gabung Otomatis)...");
  var f = getGlobalFilter();
  var defaultHeaders = ["Store", "Date", "Document No.", "Line No.", "Expense Category", "Cash/Bank Account", "In Amount IDR", "Out Amount IDR", "Balance IDR", "Notes"];

  // 1. Definisikan daftar cabang resmi iREAP lu
  var targetStores = [];
  
  if (!f.storeId || f.storeId === "ALL" || f.storeId === "" || f.storeId === "0") {
    Logger.log("🔄 Mode ALL terdeteksi: Menyiapkan antrean Emba 1 & Emba 3...");
    targetStores.push({ name: "Emba Sembako & Sayur", id: "78191" });
    targetStores.push({ name: "Emba Sembako & Sayur III", id: "138696" });
  } else {
    Logger.log("🎯 Mode Cabang Spesifik: ID " + f.storeId);
    targetStores.push({ name: "Cabang Terpilih", id: f.storeId });
  }

  // 2. Loop penarikan dan gabungkan hasilnya
  targetStores.forEach(function(store, index) {
    Logger.log("📡 [" + (index + 1) + "/" + targetStores.length + "] Menarik data untuk: " + store.name + " (ID: " + store.id + ")...");
    
    // Rakit query persis standar base lu
    var query = "/expense/report/detailci?storeid=" + store.id + "&startdate=" + f.tglAwal + "&enddate=" + f.tglAkhir + "&cash_bank_account=";
    
    // Panggil fungsi dump (data otomatis nempel/append di spreadsheet)
    dumpGenericHTML("expense/report/detailci", query, defaultHeaders);
  });

  Logger.log("🎉 SELESAI! Semua cabang Cash/Bank sukses disedot dan digabung!");
  Logger.log("=================================================");
}
