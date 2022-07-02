import * as PIXI from "pixi.js";
import * as Const from "../../etc/constant";
import { AbsScene } from "../absscene";
import { TopicManager } from "../../framework/topicmanager";

export class MainScene extends AbsScene {

    private click: boolean = false;

    constructor(context: PIXI.Application, topicManager: TopicManager) {
        super(context, topicManager);
    }

    public getName(): string {
        return "MainScene";
    }

    public getKey(): number {
        return Const.MAIN;
    }

    public onCreate(): void {
        super.onCreate();
    }

    public onUpdateWithDraw(delta: number): void {
    }

    public onDestroy(): void {
        super.onDestroy();
    }

    public onTouchDown(event: PIXI.InteractionEvent): void {
        this.click = true;
    }

    public onTouchUp(event: PIXI.InteractionEvent): void {
        this.click = false;

    }

    public onTouchMove(event: PIXI.InteractionEvent): void {
    }
}