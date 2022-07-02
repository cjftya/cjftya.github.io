import { TopicManager } from "../framework/topicmanager";
import { MediaItem } from "./mediaitem";

export class MediaData {

    private dataChangeListener?: DataChangeListner;
    private topicManager: TopicManager;

    private dataKey: string;

    constructor(key: string, topicManager: TopicManager) {
        this.topicManager = topicManager;

        this.dataKey = key;
        this.topicManager.subscribe(this.dataKey, (t, d) => this.cursorChanged(t, d));
    }

    public setListener(listener: DataChangeListner): void {
        this.dataChangeListener = listener;
    }

    public getData(): Array<MediaItem> {
        return null;
    }

    public getRead(index: number): MediaItem {
        return null;
    }

    public getCount(): number {
        return 0;
    }

    protected notify(): void {
        this.dataChangeListener();
    }

    protected swap(data: any): void {
    }

    private cursorChanged(topic: string, data: any): void {
        this.swap(data);
    }

    public destory() {
        this.topicManager.erase(this.dataKey);
        this.topicManager = null;
        this.dataChangeListener = null;
    }
}

export interface DataChangeListner {
    (): void;
}
