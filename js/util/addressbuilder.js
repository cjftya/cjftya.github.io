var AddressUtil = (function () {
    var addressUtil;

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
                return data.substring(0, data.indexOf('@'));
            }
        }
    }

    return {
        getInstance: function () {
            if (addressUtil == null) {
                addressUtil = modules();
            }
            return addressUtil;
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