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

    getTier(symbol, arr, current) {
        if (this.isSkip(arr)) {
            return 5
        }

        var lastIndex = arr.length - 1;
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
                return 3
            }

            if (current < arr[lastIndex - 3][4] || current < arr[lastIndex - 2][4]) {
                return 6
            }

            // 1 tier
            return 1
        }

        // 2 tier
        if (minusCandleCount == 1) {
            if (minusIndexArr[0] == arr.length - 2) {  // last candle
                return 5
            } else if (minusIndexArr[0] == 1) {  // first candle
                if (arr[1][4] < arr[2][4]) {
                    // 1 tier
                    return 1
                }
            } else {
                if (arr[minusIndexArr[0] + 1][4] >= arr[minusIndexArr[0] - 1][4]) {
                    return 2
                }
            }
        }

        // 4 tier
        if (minusCandleCount == 2) {
            if (arr[6][4] - arr[1][4] > 0 && arr[6][4] > arr[2][4]) {
                return 4
            }
        }
        return 5
    }
}