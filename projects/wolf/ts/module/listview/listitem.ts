import * as PIXI from "pixi.js";
import * as Topic from "../../etc/topic";
import { View } from "../view";
import { TopicManager } from "../../framework/topicmanager";
import { Size } from "../../util/size";

export class ListItem extends View {

    private readonly minValueRate: number = 0.05;
    private readonly maxValueRate: number = 1.0;

    private readonly winSize: Size;

    private container: PIXI.Container;
    private offsetPosition: PIXI.Point;
    private readonly size: { readonly width: number, readonly height: number };

    private outLine: PIXI.Graphics;
    private contentView: PIXI.Text;

    private dataPosition: number = -1;

    constructor(context: PIXI.Application, topicManager: TopicManager) {
        super(context);

        this.winSize = <Size>topicManager.read(Topic.WINDOW_SIZE);

        this.container = new PIXI.Container();

        this.offsetPosition = new PIXI.Point();

        this.size = { width: 250, height: 60 };

        const style = new PIXI.TextStyle({
            fontFamily: "Helvetica",
            fontVariant: "small-caps",
            fontSize: 16,
            fill: '#000000'
        });
        this.outLine = null; // new PIXI.Graphics();
        this.contentView = new PIXI.Text('', style);
        this.contentView.anchor.set(0.5);
        this.contentView.x += this.size.width / 2;
        this.contentView.y += this.size.height / 2;

        if (this.outLine != null) {
            this.container.addChild(this.outLine);
        }
        this.container.addChild(this.contentView);
    }

    public setDataPosition(position: number): void {
        this.dataPosition = position;
    }

    public getDataPosition(): number {
        return this.dataPosition;
    }

    public isBound(x: number, y: number): boolean {
        if (this.container.alpha < 0.5) {
            return false;
        }

        if (x < this.container.x || x > this.container.x + this.size.width) {
            return false;
        }
        if (y < this.container.y || y > this.container.y + this.size.height) {
            return false;
        }
        return true;
    }

    public getPixiView(): PIXI.DisplayObject {
        return this.container;
    }

    public getWidth(): number {
        return this.size.width;
    }

    public getHeight(): number {
        return this.size.height;
    }

    public getSize(): { readonly width: number, readonly height: number } {
        return this.size;
    }

    public getX(): number {
        return this.container.x;
    }

    public getY(): number {
        return this.container.y;
    }

    public getOffsetX(): number {
        return this.offsetPosition.x;
    }

    public getOffsetY(): number {
        return this.offsetPosition.y;
    }

    public add(x: number, y: number): void {
        this.container.x += x;
        this.container.y += y;
        this.offsetPosition.x += x;
        this.offsetPosition.y += y;
    }

    public setX(x: number): void {
        this.container.x = x;
    }

    public setY(y: number): void {
        this.container.y = y;
    }

    public set(x: number, y: number): void {
        this.container.position.set(x, y);
    }

    public setText(text: string): void {
        this.contentView.text = text;
    }

    public setColor(color: number): void {
        this.contentView.style.fill = color;
        if (this.outLine != null) {
            this.outLine.clear();
            this.outLine.beginFill(0xf4f4f4, 0);
            this.outLine.lineStyle(1, color);
            this.outLine.drawRoundedRect(0, 0, this.size.width, this.size.height, 6);
            this.outLine.endFill();
        }
    }

    public onUpdateWithDraw(delta: number): void {
        if (this.container.y <= this.winSize.getHalfHeight()) {
            this.setValueRate(Math.max((this.container.y * this.maxValueRate) / this.winSize.getHalfHeight(), this.minValueRate));
        } else {
            this.setValueRate(Math.max(((this.winSize.getHeigth() - this.container.y) * this.maxValueRate) / this.winSize.getHalfHeight(), this.minValueRate));
        }
    }

    private setValueRate(s: number): void {
        this.container.alpha = s;
    }

    public onDestroy(): void {
        super.onDestroy();
        this.container.destroy();
    }
}