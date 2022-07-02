import { TopicManager, TopicListener } from "./topicmanager";

export class SubscriberInstaller {

    private list: Array<[string, TopicListener]> = [];

    public add(topic: string, listener: TopicListener): SubscriberInstaller {
        if (listener instanceof Function) {
            this.list.push([topic, listener]);
        } else {
            console.log("listener is value");
        }
        return this;
    }

    public install(topicManager: TopicManager): void {
        for (var i = 0; i < this.list.length; i++) {
            var data = this.list[i];
            topicManager.subscribe(data[0], data[1]);
        }
    }

    public unInstall(topicManager: TopicManager): void {
        for (var i = 0; i < this.list.length; i++) {
            var data = this.list[i];
            topicManager.erase(data[0]);
        }
    }
}