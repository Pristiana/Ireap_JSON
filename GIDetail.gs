// 1️⃣ TAB: gidetail
function RawDump_GIDetail() {
  var f = getGlobalFilter();
  var query = "/gidetail?storeid=" + f.storeId + "&startdate=" + f.tglAwal + "&enddate=" + f.tglAkhir;
  var defaultHeaders = ["Store", "Date", "Good Issue No.", "Line No.", "Item Code", "Item Name", "Qty", "UoM", "Amount IDR", "Cost IDR", "Note"];
  dumpGenericHTML("gidetail", query, defaultHeaders);
}
