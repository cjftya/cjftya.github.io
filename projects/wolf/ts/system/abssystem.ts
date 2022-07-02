import * as PIXI from "pixi.js";
import { SubscriberInstaller } from "../framework/subscriberinstaller";
import { TopicManager } from "../framework/topicmanager";

export abstract class AbsSystem {

    private context: PIXI.Application;
    private subscribers?: SubscriberInstaller;
    private topicManager: TopicManager;

    constructor(context: PIXI.Application, topicManager: TopicManager) {
        this.context = context;
        this.topicManager = topicManager;
    }

    protected getContext(): PIXI.Application {
        return this.context;
    }

    protected getTopicManager(): TopicManager {
        return this.topicManager;
    }

    protected addChild(v: PIXI.DisplayObject) {
        this.context.stage.addChild(v);
    }

    public onCreate(): void {
        this.subscribers = this.registerSubscribers();
        if (this.subscribers != null) {
            this.subscribers.install(this.topicManager);
        }
    }
    public onOperate(delta: number): void { }
    public onDestroy(): void {
        if (this.subscribers != null) {
            this.subscribers.unInstall(this.topicManager);
            this.subscribers = null;
        }
        this.topicManager = null;
        this.context = null;
    }

    public onTouchUp(event: PIXI.InteractionEvent): void { }
    public onTouchDown(event: PIXI.InteractionEvent): void { }
    public onTouchMove(event: PIXI.InteractionEvent): void { }

    protected registerSubscribers(): SubscriberInstaller {
        return null;
    }
}