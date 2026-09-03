

// ====================================================================
// ⚡ 3. FUNGSI KOMANDAN: TARIK SEMUA TAB SEKALIGUS!
// ====================================================================
function RawDump_SEMUA_TAB() {
  Logger.log("🌪️ [MASS DUMP START] Menarik seluruh tab data...");
  loginCentratireap();

  RawDump_Stockpos();
  Utilities.sleep(1000);
  RawDump_GIDetail();
  Utilities.sleep(1000);
  RawDump_GRDetail();
  Utilities.sleep(1000);
  RawDump_ExpenseDetailCI();
  Utilities.sleep(1000);
  RawDump_Article();
  Utilities.sleep(1000);
  RawDump_DailyExpense();
  Utilities.sleep(1000);
  RawDump_goodReceipt();
  Utilities.sleep(1000);
  RawDump_goodIssue();

  SpreadsheetApp.getActiveSpreadsheet().toast("Seluruh 5 tab raw dump sukses disinkronkan! 🥂✨", "SELESAI", 8);
  Logger.log("🏆 [SELESAI] SEMUA 5 TAB RAW DUMP BERHASIL DI-INJECT!");
}
