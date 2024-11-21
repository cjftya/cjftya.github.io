import { SubscriberInstaller } from "./subscriberinstaller";
import { TopicListener, TopicManager } from "./topicmanager";

export abstract class Subscriber {
    
    private subscriber: SubscriberInstaller;
    private list: Map<string, TopicListener>;

    constructor() {
        this.subscriber = new SubscriberInstaller();
        this.list = new Map<string, TopicListener>();
    }

    public create(topicManager: TopicManager|null): void {
        this.registerSubscriber(this.list);
        this.list.forEach((v, k) => {
            this.subscriber.add(k, v);
        });
        this.subscriber.install(topicManager);
    }

    public destory(topicManager: TopicManager|null): void {
        this.list.clear();
        this.subscriber.unInstall(topicManager);
    }

    protected abstract registerSubscriber(list: Map<string, TopicListener>): void;
}