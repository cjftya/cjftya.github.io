import { TopicManager } from "../framework/topicmanager";
import { SubscriberInstaller } from "../framework/subscriberinstaller";
import * as Topic from "../etc/topic";

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
        this.subsciber.add(Topic.DATABASE_TITLE, (t, d) => this.loadTitleData(t, d));
        this.subsciber.add(Topic.DATABASE_MAIN, (t, d) => this.loadMainData(t, d));
    }

    private loadTitleData(topic: string, data: any): void {
        console.log("loadTitleData");
        this.topicManager.publish(Topic.MEDIA_DATA_TITLE, require("../../data/databasetitle.json"));
    }

    private loadMainData(topic: string, data: any): void {
        console.log("loadMainData");
        this.topicManager.publish(Topic.MEDIA_DATA_MAIN, require("../../data/databasemain.json"));
    }
}