// 2️⃣ TAB: grdetail
function RawDump_GRDetail() {
  var f = getGlobalFilter();
  var query = "/grdetail?storeid=" + f.storeId + "&startdate=" + f.tglAwal + "&enddate=" + f.tglAkhir;
  var defaultHeaders = ["Store", "Date", "Good Receipt No.", "Line No.", "Item Code", "Item Name", "Qty", "UoM", "Amount IDR", "Cost IDR", "Note", "Supplier"];
  dumpGenericHTML("grdetail", query, defaultHeaders);
}
