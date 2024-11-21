import { Log } from "../etc/log";
import { TopicListener, TopicManager } from "./topicmanager";

export class SubscriberInstaller {

    private TAG: string = "SubscriberInstaller";

    private list: Array<[string, TopicListener]> = [];

    public add(key: string, listener: TopicListener): SubscriberInstaller {
        if (listener instanceof Function) {
            this.list.push([key, listener]);
        } else {
            Log.e(this.TAG, "listener is value");
        }
        return this;
    }

    public install(topicManager: TopicManager|null): void {
        for (var i = 0; i < this.list.length; i++) {
            var data = this.list[i];
            if (topicManager != null) {
                topicManager.subscribe(data[0], data[1]);
            }
        }
    }

    public unInstall(topicManager: TopicManager|null): void {
        for (var i = 0; i < this.list.length; i++) {
            var data = this.list[i];
            if (topicManager != null) {
                topicManager.erase(data[0]);
            }
        }
    }
}