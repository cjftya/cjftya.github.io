import { TopicManager } from "../framework/topicmanager";
import { SubscriberInstaller } from "../framework/subscriberinstaller";
import { AddressKey } from "../etc/addresskey";
import { DataRequest } from "../etc/datakey";

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
        this.topicManager.publish(DataRequest.getDataBaseKey(key), key);
    }

    public close(): void {
        this.subsciber.unInstall(this.topicManager);
        this.subsciber = null;
        this.topicManager = null;
    }

    private registerDataSubscriber(): void {
        this.subsciber.add(DataRequest.getDataBaseKey(AddressKey.Title), (t, d) => this.loadTitleData(t, d));
        this.subsciber.add(DataRequest.getDataBaseKey(AddressKey.Main), (t, d) => this.loadMainData(t, d));
    }

    private loadTitleData(topic: string, key: string): void {
        console.log("loadTitleData");
        this.topicManager.publish(DataRequest.getMediaDataKey(key), require("../../data/databasetitle.json"));
    }

    private loadMainData(topic: string, key: string): void {
        console.log("loadMainData");
        this.topicManager.publish(DataRequest.getMediaDataKey(key), require("../../data/databasemain.json"));
    }
}