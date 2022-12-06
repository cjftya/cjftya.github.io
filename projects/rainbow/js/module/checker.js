class Checker {

    getMinusCandleIndexArr(arr) {
        var list = []
        for (var i = 1; i < arr.length - 1; i++) {
            if (arr[i][4] - arr[i - 1][4] < 0) {
                list.push(i)
            }
        }
        return list
    }

    isSkip(arr) {
        var minusIndexArr = this.getMinusCandleIndexArr(arr)
        var minusCandleCount = minusIndexArr.length
        if (minusCandleCount == 1) {
            var closeDiff = arr[arr.length - 1][4] - arr[1][4]
            return arr[minusIndexArr[0]][2] > arr[minusIndexArr[0]][4] + (closeDiff * 2)
        } else {
            return minusCandleCount >= 3
        }
    }

    getClasiffiedData(symbol, arr) {
        if (this.isSkip(arr)) {
            return []
        }

        var minusIndexArr = this.getMinusCandleIndexArr(arr)
        var minusCandleCount = minusIndexArr.length

        if (minusCandleCount == 0) {
            var maxDiff = 0
            var maxIndex = -1
            for (var i = 2; i < arr.length - 1; i++) {
                if (arr[i][4] - arr[i - 1][4] > maxDiff) {
                    maxDiff = arr[i][4] - arr[i - 1][4]
                    maxIndex = i
                }
            }
            // 3 tier
            if ((arr[maxIndex - 1][4] - arr[1][4]) * 3 < maxDiff) {
                return this.getResults(symbol, 3, arr)
            }
            // 1 tier
            return this.getResults(symbol, 1, arr)
        }

        // 2 tier
        if (minusCandleCount == 1) {
            if (minusIndexArr[0] == arr.length - 2) {  // last candle
                return []
            } else if (minusIndexArr[0] == 1) {  // first candle
                if (arr[1][4] < arr[2][4]) {
                    return this.getResults(symbol, 2, arr)
                }
            } else {
                if (arr[minusIndexArr[0] + 1][4] >= arr[minusIndexArr[0] - 1][4]) {
                    return this.getResults(symbol, 2, arr)
                }
            }
        }

        // 4 tier
        if (minusCandleCount == 2) {
            if (arr[6][4] - arr[1][4] > 0 && arr[6][4] > arr[2][4]) {
                return this.getResults(symbol, 4, arr)
            }
        }
        return []
    }

    getResults(symbol, tier, arr) {
        var urlSymbol = symbol.replace('/', '_')
        return [symbol, tier, "stop(1) " + arr[3][3] + "\nstop(2) " + arr[1][3], "https://www.binance.com/en/trade/" + urlSymbol + "?theme=dark&type=spot"]
    }
}