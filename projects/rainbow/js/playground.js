this.initialize()

function initialize() {
   var checker = new Checker()
   var marketInfo = new MarketInfo()

   document.addEventListener("DOMContentLoaded", ready)

   this.loadClassifiedData(checker, marketInfo).then(list => {
      var addhtml = ""
      for (var i = 0; i < list.length; i++) {
         addhtml += "<tr align=\"center\"></tr>"
         addhtml += "<th>" + (i + 1) + "</th><th>" + list[i][0] + "</th><th>" + list[i][1]
            + "</th><th>" + list[i][2] + "</th><th><a href=" + list[i][3] + " target=\"_blank\">Show</a></th></tr>"
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
         var mk_ohlcv = await marketInfo.getPastDataArray(mk, "30m", 7)
         var result = checker.getClasiffiedData(mk, mk_ohlcv)
         if (result.length > 0) {
            resultList.push(result)
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