import * as PIXI from "pixi.js";
import { TopicManager } from "../../framework/topicmanager";
import { Size } from "../../support/size";
import { ViewGroup } from "../viewgroup";
import { ListItem } from "./listitem";
import { ListAdapter } from "./listadapter";
import { IListView } from "./ilistview";
import { Message } from "../../support/message";
import { Events } from "../../support/events";
import { TopicKey } from "../../etc/topickey";
import { MediaItem } from "../../database/mediaitem";

export class ListView extends ViewGroup implements IListView {

    private readonly listItemGap: number = 35;
    private readonly maxScrollSpeed: number = 70;

    private clickIndex: number = -1;
    private click: boolean = false;
    private createdItemViewCount: number = 0;
    private firstListIndex: number = 0;
    private lastListIndex: number = -1;

    private winSize: Size;

    private adapter: ListAdapter;
    private views: Array<ListItem>;

    private pos: PIXI.Point = new PIXI.Point();
    private oldPos: PIXI.Point = new PIXI.Point();
    private vel: PIXI.Point = new PIXI.Point();

    private itemClickListener?: onItemClickListener;

    constructor(context: PIXI.Application, topicManger: TopicManager) {
        super(context);

        this.winSize = topicManger.read(TopicKey.WINDOW_SIZE);

        var limitCount = 0;
        this.views = Array<ListItem>();
        for (let i = 0; ; i++) {
            this.views.push(new ListItem(context, topicManger));
            this.addChild(this.views[i]);
            if ((this.views[i].getHeight() + this.listItemGap) * (i + 1) > this.winSize.getHeigth()) {
                if (++limitCount > 2) {
                    this.createdItemViewCount = i;
                    this.lastListIndex = i;
                    break;
                } else {
                    continue;
                }
            }
        }
        this.createdItemViewCount = this.lastListIndex;
        console.log("create view item : " + this.views.length);
    }

    private getPositionFromViewPosition(position: number, height: number): number {
        return position * height + (position * this.listItemGap);
    }

    public getAdaper(): ListAdapter {
        return this.adapter;
    }

    public setAdapter(adapter: ListAdapter) {
        this.adapter = adapter;
    }

    public sendMessage(e: Message): void {
        if (!this.handleEvent(e)) {
            console.log("not found message : " + e.getEvent());
        }
    }

    private handleEvent(e: Message): boolean {
        switch (e.getEvent()) {
            case Events.NOTIFY:
                this.update();
                return true;
            default:
                return false;
        }
    }

    public setOnItemClickListener(listener: onItemClickListener) {
        this.itemClickListener = listener;
    }

    private onItemClicked(view: ListItem, item: MediaItem, dataPosition: number): void {
        view.setColor(0xff00ff);  // test code
        if (this.itemClickListener != null) {
            this.itemClickListener(item, dataPosition);
        }
    }

    public onUpdateWithDraw(delta: number): void {
        this.vel.y *= 0.99;
        for (var i = 0; i < this.views.length; i++) {
            if (!this.click) {
                this.views[i].add(0, this.vel.y * delta);
            }
            this.views[i].onUpdateWithDraw(delta);
        }
        this.updateArea();
    }

    public onDestroy(): void {
        super.onDestroy();
        this.adapter.destroy();
        this.adapter = null;
        this.views = null;
        this.itemClickListener = null;
    }

    public onTouchUp(event: PIXI.InteractionEvent): void {
        this.click = false;
        if (this.clickIndex != -1) {
            if (this.checkBound(event.data.global.x, event.data.global.y) == this.clickIndex) {
                const pos = this.views[this.clickIndex].getDataPosition();
                this.onItemClicked(this.views[this.clickIndex], this.adapter.getItem(pos), pos);
            }
            this.clickIndex = -1;
        }
    }

    public onTouchDown(event: PIXI.InteractionEvent): void {
        this.click = true;
        this.pos.set(event.data.global.x, event.data.global.y);
        this.oldPos.set(event.data.global.x, event.data.global.y);
        this.vel.set(0, 0);
        this.clickIndex = this.checkBound(event.data.global.x, event.data.global.y);
    }

    public onTouchMove(event: PIXI.InteractionEvent): void {
        if (this.click && Math.abs(event.data.global.y - this.pos.y) > 2) {
            this.clickIndex = -1;
            this.vel.y = this.getScrollSpeed(event.data.global.y - this.oldPos.y);
            this.oldPos.set(event.data.global.x, event.data.global.y);

            for (var i = 0; i < this.views.length; i++) {
                this.views[i].add(0, this.vel.y);
            }
        }
    }

    private getScrollSpeed(v: number): number {
        return v > this.maxScrollSpeed ? this.maxScrollSpeed :
            (v < -this.maxScrollSpeed ? -this.maxScrollSpeed : v);
    }

    private updateArea(): void {
        for (var i = 0; i < this.views.length; i++) {
            var topLimit = this.views[i].getY() + (this.views[i].getHeight() + this.listItemGap) * 2;
            var bottomLimit = (this.views[i].getY() + this.views[i].getHeight()) - (this.views[i].getHeight() + this.listItemGap) * 2;
            if (topLimit < 0) {
                var yPos = this.getPositionFromViewPosition(this.lastListIndex + 1, this.views[i].getHeight());
                this.adapter.bindItem(this.views[i], Math.abs(this.lastListIndex + 1) % this.adapter.getCount());
                this.views[i].setY(yPos + this.views[i].getOffsetY());
                this.firstListIndex++;
                this.lastListIndex++;
                // console.log("load item bottom : view=" + i + ", data=" + this.__lastListIndex);
                break;
            } else if (bottomLimit > this.winSize.getHeigth()) {
                var yPos = this.getPositionFromViewPosition(this.firstListIndex - 1, this.views[i].getHeight());
                this.adapter.bindItem(this.views[i], Math.abs(this.firstListIndex - 1) % this.adapter.getCount());
                this.views[i].setY(yPos + this.views[i].getOffsetY());
                this.firstListIndex--;
                this.lastListIndex--;
                // console.log("load item top : view=" + i + ", data=" + this.__firstListIndex);
                break;
            }
        }
    }

    private checkBound(x: number, y: number): number {
        for (var i = 0; i < this.views.length; i++) {
            if (this.views[i].isBound(x, y)) {
                return i;
            }
        }
        return -1;
    }

    private update(): void {
        this.firstListIndex = 0;
        this.lastListIndex = this.createdItemViewCount;
        this.pos.set(0, 0);
        this.oldPos.set(0, 0);
        this.vel.set(0, 0);
        for (var i = 0; i < this.views.length; i++) {
            this.views[i].set(this.winSize.getWidth() / 2 - this.views[i].getWidth() / 2,
                this.getPositionFromViewPosition(i, this.views[i].getHeight()));
            this.adapter.bindItem(this.views[i], i);
        }
    }
}

interface onItemClickListener {
    (item: MediaItem, position: number): void
}