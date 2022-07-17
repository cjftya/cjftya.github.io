import { TopicManager } from "../framework/topicmanager";
import { SubscriberInstaller } from "../framework/subscriberinstaller";
import { TopicKey } from "../etc/topickey";

export class DataBase {

    private subsciber: SubscriberInstaller;
    private topicManager: TopicManager;

    constructor(topicManager: TopicManager) {
        this.topicManager = topicManager;
        this.subsciber = new SubscriberInstaller();
        this.registerDataSubscriber();
        this.subsciber.install(this.topicManager);
    }

    public open(key: string): void {
        this.topicManager.publish(key, null);
    }

    public close(): void {
        this.subsciber.unInstall(this.topicManager);
        this.subsciber = null;
        this.topicManager = null;
    }

    private registerDataSubscriber(): void {
        this.subsciber.add(TopicKey.DATABASE_TITLE, (t, d) => this.loadTitleData(t, d));
        this.subsciber.add(TopicKey.DATABASE_MAIN, (t, d) => this.loadMainData(t, d));
    }

    private loadTitleData(topic: string, data: any): void {
        console.log("loadTitleData");
        this.topicManager.publish(TopicKey.MEDIA_DATA_TITLE, require("../../data/databasetitle.json"));
    }

    private loadMainData(topic: string, data: any): void {
        console.log("loadMainData");
        this.topicManager.publish(TopicKey.MEDIA_DATA_MAIN, require("../../data/databasemain.json"));
    }
}