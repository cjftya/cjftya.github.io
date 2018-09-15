var Broker = (function () {
    var brokerSet;

    return {
        getInstance: function () {
            if (brokerSet == null) {
                brokerSet = new BrokerSet();
                console.log("create new broker");
            }
            return brokerSet;
        }
    };
})();

class BrokerSet {
    constructor() {
        this.map = new Map();
    }

    publishOnlyValue(topic, data) {
        if(data instanceof Function) {
            throw new Error("data type is Function");
        } else {
            if (this.map.has(topic)) {
                console.log("value overwrite");
            }
            this.map.set(topic, data);
        }
    }

    read(topic) {
        var value = this.map.get(topic);
        if (value == null) {
            console.log("not found data");
            return null;
        } else {
            if (value instanceof Function) {
                throw new Error("you can't read Function");
            } else {
                return value;
            }
        }
    }

    publish(topic, data) {
        if (this.map.has(topic)) {
            var value = this.map.get(topic);
            if (value == null) {
                console.log("value is null");
            } else {
                for (var i = 0; i < value.length; i++) {
                    value[i](topic, data);
                }
            }
        } else {
            console.log("not found " + topic + " topic");
        }
    }

    subscribe(topic, listener) {
        if (!listener instanceof Function) {
            throw new Error("data type isn't Function");
        }

        if (this.map.has(topic)) {
            var value = this.map.get(topic);
            if (value == null) {
                this.map.set(topic, []);
                value = this.map.get(topic);
            }
            value.push(listener);
        } else {
            var value = [listener];
            this.map.set(topic, value);
        }
    }

    release(topic) {
        if (this.map.delete(topic)) {
            console.log(topic + " release complete");
        } else {
            console.log("not found " + topic + " topic");
        }
    }

    clear() {
        this.map.clear();
    }
}