// 3️⃣ TAB: expense/report/detailci
function RawDump_ExpenseDetailCI() {
  var f = getGlobalFilter();
  var query = "/expense/report/detailci?storeid=" + f.storeId + "&startdate=" + f.tglAwal + "&enddate=" + f.tglAkhir + "&cash_bank_account=";
  var defaultHeaders = ["Store", "Date", "Document No.", "Line No.", "Expense Category", "Cash/Bank Account", "In Amount IDR", "Out Amount IDR", "Balance IDR", "Notes"];
  dumpGenericHTML("expense/report/detailci", query, defaultHeaders);
}
