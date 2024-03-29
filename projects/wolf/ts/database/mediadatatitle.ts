import { MediaData } from "./mediadata";
import { MediaItem } from "./mediaitem";
import { TopicManager } from "../framework/topicmanager";

export class MediaDataTitle extends MediaData {

    private listData: Array<MediaItem>;

    constructor(key: string, topicManager: TopicManager) {
        super(key, topicManager);
    }

    public getData(): Array<MediaItem> {
        return this.listData;
    }

    public getRead(index: number): MediaItem {
        return this.listData.at(index);
    }

    public getCount(): number {
        return this.listData.length;
    }

    private compareData(data: Array<MediaItem>): boolean {
        if (this.listData == null) {
            this.listData = Array<MediaItem>();
            return false;
        }
        if (this.listData.length != data.length) {
            return false;
        }
        for (let i = 0; i < this.listData.length; i++) {
            if (!this.compare(this.listData.at(i), data.at(i))) {
                return false;
            }
        }
        return true;
    }

    private compare(a: MediaItem, b: MediaItem): boolean {
        return a.getName() == b.getName() &&
            a.getColor() == b.getColor() &&
            a.getStageId() == b.getStageId();
    }

    private createMediaItem(data: any): MediaItem {
        const item = new MediaItem();
        item.setName(data.name);
        item.setColor(data.color);
        item.setStageId(data.stage_id);
        return item;
    }

    private loadData(table: Array<MediaItem>, data: any): void {
        for (const v of data.listdata) {
            table.push(this.createMediaItem(v));
        }
    }

    protected swap(data: any): void {
        let newData = Array<MediaItem>();
        this.loadData(newData, data);
        if (!this.compareData(newData)) {
            this.listData = newData;
            this.notify();
        }
    }

    public destory(): void {
        super.destory();
        this.listData = null;
    }
}