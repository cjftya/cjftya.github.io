var AddressUtil = (function () {
    var addressUtil;

    return {
        getInstance: function () {
            if (addressUtil == null) {
                addressUtil = new AddressUtil();
            }
            return addressUtil;
        },

        getArg: function (key) {

            return 0;
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

    removeArgs() {
        this.__address = this.__address.substring(0, this.__address.indexOf('/') - 1);
        return this;
    }

    build() {
        return this.__address;
    }
}