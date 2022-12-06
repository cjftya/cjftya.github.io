class MarketInfo {

    constructor() {
        this.binanceusdm = new ccxt.binanceusdm()
        this.notSupportList = STOP_MARKET_LIST
    }

    notSupportMarket(market) {
        for (const data of this.notSupportList) {
            if (market.startsWith(data)) {
                return true
            }
        }
        return false
    }

    // need await : server call
    getAllMarkets() {
        return this.binanceusdm.loadMarkets()
    }

    // need await : server call
    getPastDataArray(market, time, count) {
        return this.binanceusdm.fetchOHLCV(market, time, undefined, undefined, { 'limit': count })
    }
}

