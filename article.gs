// 4️⃣ TAB: article (DATA BARANG MASTER)
function RawDump_Article() {
  var defaultHeaders = ["System ID", "Item Code", "Description", "Category", "Normal Price", "Promo Price", "Wholesale Price", "Wholesale Promo", "UoM", "Min Stock", "Tax (%)", "Non Stock", "Unsellable", "Open Price", "Status", "Last Update", "Cost"];
  dumpGenericHTML("article", "/article", defaultHeaders);
}
