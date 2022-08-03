import * as PIXI from "pixi.js";
import { AbsScene } from "../absscene";
import { TopicManager } from "../../framework/topicmanager";
import { L } from "../../etc/constlinker";

export class MainScene extends AbsScene {

    private click: boolean = false;

    constructor(address: string, context: PIXI.Application, topicManager: TopicManager) {
        super(address, context, topicManager);
    }

    public getName(): string {
        return "MainScene";
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