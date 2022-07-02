import * as PIXI from "pixi.js";
import { ViewGroup } from "../module/viewgroup"
import { TopicManager } from "../framework/topicmanager";
import { MediaData } from "../database/mediadata";
import { MediaDataFactory } from "../database/mediadatafactory";
import { ISceneView } from "./isceneview";

export abstract class AbsScene extends ViewGroup implements ISceneView {

    private mediaData: MediaData;
    private topicManger: TopicManager;

    constructor(context: PIXI.Application, topicManger: TopicManager) {
        super(context);

        this.topicManger = topicManger;

        this.mediaData = MediaDataFactory.cretae(this.getKey(), topicManger);
        this.mediaData.setListener(() => this.dataChanged());
    }

    public getName(): string {
        return "AbsScene";
    }

    public getKey(): number {
        return -1;
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