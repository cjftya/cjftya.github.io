var TopicManager = (function () {
    var __manager;
    var __topicMap;

    function modules() {
        return {
            read: function (topic) {
                var value = __topicMap.get(topic);
                if (value == null) {
                    console.log("not found data : " + topic);
                    return null;
                } else {
                    if (value instanceof Function) {
                        throw new Error("you can't read Function : " + topic);
                    } else {
                        return value;
                    }
                }
            },

            write: function (topic, data) {
                if (data instanceof Function) {
                    throw new Error("data type is Function : " + topic);
                } else {
                    if (__topicMap.has(topic)) {
                        console.log("value overwrite : " + topic);
                    }
                    __topicMap.set(topic, data);
                }
            },

            publish: function (topic, data) {
                if (__topicMap.has(topic)) {
                    var value = __topicMap.get(topic);
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
            },

            subscribe: function (topic, listener) {
                if (!listener instanceof Function) {
                    throw new Error("data type isn't Function");
                }

                if (__topicMap.has(topic)) {
                    var value = __topicMap.get(topic);
                    if (value == null) {
                        __topicMap.set(topic, []);
                        value = __topicMap.get(topic);
                    }
                    value.push(listener);
                } else {
                    var value = [listener];
                    __topicMap.set(topic, value);
                }
            },

            release: function (topic) {
                if (__topicMap.delete(topic)) {
                    console.log(topic + " release complete");
                } else {
                    console.log("not found " + topic + " topic");
                }
            },

            clear: function () {
                __topicMap.clear();
            }
        }
    }

    return {
        ready: function () {
            if (__manager == null) {
                __manager = modules();
                __topicMap = new Map();
            }
            return __manager;
        }
    };
})();