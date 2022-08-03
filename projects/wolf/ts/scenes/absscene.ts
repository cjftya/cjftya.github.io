import * as PIXI from "pixi.js";
import { ViewGroup } from "../module/viewgroup"
import { TopicManager } from "../framework/topicmanager";
import { MediaData } from "../database/mediadata";
import { MediaDataFactory } from "../database/mediadatafactory";
import { ISceneView } from "./isceneview";
import { DataRequest } from "../etc/datakey";
import { AddressBuilder, AddressUtil } from "../framework/addressbuilder";

export abstract class AbsScene extends ViewGroup implements ISceneView {

    private address: string;
    private mediaData: MediaData;
    private topicManger: TopicManager;

    constructor(address: string, context: PIXI.Application, topicManger: TopicManager) {
        super(context);

        this.address = address;
        this.topicManger = topicManger;

        const key = AddressUtil.getAddress(address);
        this.mediaData = MediaDataFactory.create(DataRequest.getMediaDataKey(key), topicManger);
        this.mediaData.setListener(() => this.dataChanged());
    }

    public getAddress(): string {
        return this.address;
    }

    public getName(): string {
        return "AbsScene";
    }

    public getTopicManager(): TopicManager {
        return this.topicManger;
    }

    public getMediaData(): MediaData {
        return this.mediaData;
    }

    private dataChanged(): void {
        console.log("dataChangedUI");
        this.onBind();
    }

    public onBind(): void {
    }

    public onDestroy(): void {
        super.onDestroy();
        this.mediaData.destory();
        this.mediaData = null;
    }
}