import * as PIXI from "pixi.js";
import * as Const from "../../etc/constant";
import * as Topic from "../../etc/topic";
import { AbsScene } from "../absscene"
import { MathUtil } from "../../util/mathUtil";
import { TopicManager } from "../../framework/topicmanager";
import { Size } from "../../util/size";
import { ListView } from "../../module/listview/listview";
import { ListAdapter } from "../../module/listview/listadapter";

export class TitleScene extends AbsScene {

    private listView: ListView;

    private click: boolean = false;
    private dragPointer: PIXI.Point;

    private winSize: Size;

    constructor(context: PIXI.Application, topicManager: TopicManager) {
        super(context, topicManager);

        this.winSize = this.getTopicManager().read(Topic.WINDOW_SIZE);

        this.dragPointer = new PIXI.Point();

        this.bindBackground();

        this.listView = new ListView(context, topicManager);
        this.listView.setAdapter(new ListAdapter(this.getMediaData()));
        this.addChild(this.listView);

        // this.__pointEffect = new PointerEffect(context);
        // this.addChild(this.__pointEffect);
    }

    public onBind(): void {
        this.listView.notify();
    }

    public getName(): string {
        return "TitleScene";
    }

    public getKey(): number {
        return Const.TITLE;
    }

    public onUpdateWithDraw(delta: number): void {
        this.listView.onUpdateWithDraw(delta);
        // this.__pointEffect.onUpdateWithDraw(delta);
    }

    public onTouchDown(event: PIXI.InteractionEvent) {
        this.click = true;
        this.dragPointer.set(event.data.global.x, event.data.global.y);
        this.listView.onTouchDown(event);
        // this.__pointEffect.onTouchDown(event);
    }

    public onTouchUp(event: PIXI.InteractionEvent) {
        this.click = false;
        this.listView.onTouchUp(event);
        if (this.isMoved(event)) {
            // this.__pointEffect.onTouchUp(event);
        }
    }

    public onTouchMove(event: PIXI.InteractionEvent) {
        this.listView.onTouchMove(event);
    }

    private bindBackground() {
        const gradTexture = this.createGradTexture();
        const sprite = new PIXI.Sprite(gradTexture);
        sprite.position.set(0, 0);
        sprite.alpha = 1;
        sprite.width = this.winSize.getWidth();
        sprite.height = this.winSize.getHeigth();
        this.addChild(sprite);

        const graphics = new PIXI.Graphics();
        graphics.beginFill(0x000000, 1);
        graphics.drawEllipse(this.winSize.getWidth() / 2, this.winSize.getHeigth(), this.winSize.getWidth() / 1.8, this.winSize.getWidth() / 6);
        graphics.endFill();

        for (var i = 0; i < 90; i++) {
            graphics.beginFill(0xfcfcfc, 0.8);
            graphics.drawCircle(MathUtil.randInt(0, this.winSize.getWidth()), MathUtil.randInt(50, this.winSize.getHeigth() / 1.3),
                MathUtil.randInt(2, 3) / 3);
            graphics.endFill();
        }

        this.addChild(graphics);
    }

    private createGradTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = this.winSize.getWidth();
        canvas.height = this.winSize.getHeigth();

        const ctx = canvas.getContext('2d');

        let grd = ctx.createRadialGradient(this.winSize.getWidth() / 2, this.winSize.getHeigth(), 0, this.winSize.getWidth() / 2, this.winSize.getHeigth(), this.winSize.getWidth() / 1.2);
        grd.addColorStop(0, 'hsla(349, 94%, 75%, 1)');
        grd.addColorStop(0.12, 'hsla(342, 49%, 62%, 1)');
        grd.addColorStop(0.18, 'hsla(328, 37%, 56%, 1)');
        grd.addColorStop(0.33, 'hsla(281, 33%, 48%, 1)');
        grd.addColorStop(0.41, 'hsla(268, 38%, 48%, 1)');
        grd.addColorStop(0.45, 'hsla(266, 38%, 43%, 1)');
        grd.addColorStop(0.55, 'hsla(261, 37%, 32%, 1)');
        grd.addColorStop(0.64, 'hsla(253, 36%, 24%, 1)');
        grd.addColorStop(0.72, 'hsla(244, 33%, 19%, 1)');
        grd.addColorStop(0.78, 'hsla(240, 33%, 17%, 1)');
        ctx.fillStyle = grd;
        ctx.arc(this.winSize.getWidth() / 2, this.winSize.getHeigth(), this.winSize.getWidth() / 1.2, 0, (Math.PI / 180) * 360, true);
        ctx.fill();

        return PIXI.Texture.from(canvas);
    }

    private isMoved(event: PIXI.InteractionEvent) {
        return Math.abs(event.data.global.x - this.dragPointer.x) <= 2 ||
            Math.abs(event.data.global.y - this.dragPointer.y) <= 2;
    }
}