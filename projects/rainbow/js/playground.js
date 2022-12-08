this.initialize()

function initialize() {
   var checker = new Checker()
   var marketInfo = new MarketInfo()

   document.addEventListener("DOMContentLoaded", ready)

   this.loadClassifiedData(checker, marketInfo).then(list => {
      var addhtml = ""
      for (var i = 0; i < list.length; i++) {
         addhtml += "<tr align=\"center\"></tr>"
         addhtml += "<th>" + (i + 1) + "</th>"
            + "<th>" + list[i][0] + "</th>"
            + "<th>" + list[i][1] + "</th>"
            + "<th>" + list[i][2] + "</th>"
            + "<th>" + list[i][3] + "</th>"
            + "<th><a href=" + list[i][4] + " target=\"_blank\">Show</a></th></tr>"
      }
      document.getElementById("table_box").innerHTML = addhtml

      this.showTable()
   })
}

function ready() {
   var Agent = navigator.userAgent.toLowerCase();
   var isMobile = /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
   if (isMobile && Agent.includes("kakao")) {
      if (!navigator.userAgent.match(/iPhone|iPad/i)) {
         location.href = 'kakaotalk://inappbrowser/close';
         location.href = 'intent://' + location.href.replace(/https?:\/\//i, '') + '#Intent;scheme=http;package=com.android.chrome;end';
      }
   }
}

function showTable() {
   document.getElementById("load_bar").style.display = "none"
   document.getElementById("data_table").style.display = "block"
}

async function loadClassifiedData(checker, marketInfo) {
   var allMarkets = await marketInfo.getAllMarkets()
   var usdtMarkets = []
   var symbols = Object.keys(allMarkets)
   for (var i = 0; i < symbols.length; i++) {
      if (symbols[i].endsWith("/USDT")) {
         usdtMarkets.push(symbols[i])
      }
   }
   //=========

   var i = 0
   var resultList = []
   var loadBarLabel = document.getElementById("load_text")
   for (const mk of usdtMarkets) {
      if (!marketInfo.notSupportMarket(mk)) {
         var ohlcv15m = await marketInfo.getPastDataArray(mk, "15m", 7)
         var ohlcv30m = await marketInfo.getPastDataArray(mk, "30m", 7)
         var tier15m = checker.getTier(mk, ohlcv15m)
         var tier30m = checker.getTier(mk, ohlcv30m)
         if (tier15m > 0 || tier30m > 0) {
            resultList.push(this.getResults(mk, tier15m, tier30m, ohlcv15m))
         }
      }
      var rate = Math.floor(((++i) * 100) / usdtMarkets.length)
      loadBarLabel.textContent = this.getRate(rate, 3) + " %"
   }
   resultList.sort(function (a, b) {
      return a[1] - b[1]
   })
   return resultList
}

function getRate(n, w) {
   n = n + '';
   return n.length >= w ? n : new Array(w - n.length + 1).join('0') + n;
}

function getResults(symbol, tier15m, tier30m, arr) {
   // "https://www.binance.com/en/trade/" + urlSymbol + "?theme=dark&type=spot"
   // "https://kr.tradingview.com/chart/?symbol=BINANCE%3A" + urlSymbol + "USDTPERP"
   var urlSymbol = symbol.replace("/USDT", "")
   return [urlSymbol, tier15m, tier30m,
      "stop(1) " + arr[3][3] + "\\nstop(2) " + arr[1][3], "https://kr.tradingview.com/chart/?symbol=BINANCE%3A" + urlSymbol + "USDTPERP"]
}

function getTierString(tier) {
   return tier == -1 ? '-' : tier
}