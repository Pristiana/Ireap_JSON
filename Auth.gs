// 👑 GLOBAL VARIABLE BIAR COOKIE BISA DIPAKAI RAME-RAME
var COOKIE_SAKTI = "";
var HEADERS_TOPENG = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
};

// 📊 FUNGSIONALITAS LOADING BAR UNTUK MEMANJAKAN MATA LOGGING
function cetakProgress(step, totalStep, statusPesan) {
  var persen = Math.round((step / totalStep) * 100);
  var panjangBar = 15;
  var isiBar = Math.round((persen / 100) * panjangBar);
  var barTeks = "";
  for (var i = 0; i < panjangBar; i++) {
    barTeks += (i < isiBar) ? "█" : "░";
  }
  Logger.log("⚙️ [" + barTeks + "] " + persen + "% | " + statusPesan);
}

// 🔐 1️⃣ FUNGSI LOGIN TUNGGAL 
function loginCentratireap() {
  Logger.log("=================================================");
  cetakProgress(1, 5, "Memulai ritual handshake awal ke server iReap...");
  var loginUrl = "https://pro.ireappos.com/login"; 
  var payload = { "email": "pristiana.faisal@gmail.com", "password": "1610IrEaP@" };

  function createCookie(response) {
    var c = response.getAllHeaders()["Set-Cookie"];
    if (!c) return "";
    return Array.isArray(c) ? c.map(x => x.split(';')[0]).join('; ') : c.split(';')[0];
  }

  var resAwal = UrlFetchApp.fetch(loginUrl, { "method": "get", "headers": HEADERS_TOPENG, "followRedirects": false });
  HEADERS_TOPENG["Cookie"] = createCookie(resAwal);
  cetakProgress(3, 5, "Mencuri Token Session Awal... [DONE]");

  var resLogin = UrlFetchApp.fetch(loginUrl, { "method": "post", "payload": payload, "headers": HEADERS_TOPENG, "followRedirects": false });
  if (resLogin.getResponseCode() === 200) {
    Logger.log("🚨 [CRITICAL ERROR] Kredensial lu ditendang mentah-mentah sama server!");
    throw new Error("❌ ZONK! Email/Password lu salah, mblo!");
  }
  
  COOKIE_SAKTI = createCookie(resLogin) || HEADERS_TOPENG["Cookie"];
  HEADERS_TOPENG["Cookie"] = COOKIE_SAKTI;
  cetakProgress(5, 5, "🔑 Sesi Login Sukses Total! Cookie Sakti diamankan.");
  Logger.log("=================================================");
}
