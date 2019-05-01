class SubscriberInstaller {
    constructor() {
        this.list = [];
    }

    add(topic, listener) {
        if (listener instanceof Function) {
            this.list.push([topic, listener]);
        } else {
            console.log("listener is value");
        }
        return this;
    }

    install(topicManager) {
        for (var i = 0; i < this.list.length; i++) {
            var data = this.list[i];
            topicManager.subscribe(data[0], data[1]);
        }
    }

    unInstall(topicManager) {
        for (var i = 0; i < this.list.length; i++) {
            var data = this.list[i];
            topicManager.release(data[0]);
        }
    }
}