var AddressUtil = (function () {
    var __addressUtil;

    function modules() {
        return {
            getArg: function (data, key) {
                var args = data.substring(data.indexOf('@') + 2, data.length).split('/');
                for (var i in args) {
                    var set = args[i].split('?');
                    if (set[0] == key) {
                        return set[1];
                    }
                }
                return null;
            },
            
            getAddress: function (data) {
                return data.substring(0, data.indexOf('@')).split('#')[1];
            }
        }
    }

    return {
        getInstance: function () {
            if (__addressUtil == null) {
                __addressUtil = modules();
            }
            return __addressUtil;
        }
    };
})();

class AddressBuilder {
    constructor(mainAddress) {
        this.__address = "address#" + mainAddress + '@';
    }

    appendArg(key, value) {
        var v = !(value instanceof String) ? value.toString() : value;
        this.__address += '/' + key + '?' + v;
        return this;
    }

    build() {
        return this.__address;
    }
}