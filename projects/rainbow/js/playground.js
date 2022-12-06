this.initialize()

function initialize() {
   var checker = new Checker()
   var marketInfo = new MarketInfo()


   this.loadClassifiedData(checker, marketInfo).then(list => {
      var addhtml = ""
      for (var i = 0; i < list.length; i++) {
         addhtml += "<tr align=\"center\"></tr>"
         addhtml += "<th>" + i + "</th><th>" + list[i][0] + "</th><th>" + list[i][1]
            + "</th><th>" + list[i][2] + "</th><th><a href=" + list[i][3] + " target=\"_blank\">Show</a></th></tr>"
      }
      document.getElementById("table_box").innerHTML = addhtml

      this.showTable()
   })
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
      var rate = ((++i) * 100) / usdtMarkets.length
      loadBarLabel.textContent = Math.floor(rate)
   }
   resultList.sort(function (a, b) {
      return a[1] - b[1]
   })
   return resultList
} 