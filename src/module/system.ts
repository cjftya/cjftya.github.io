import * as PIXI from "pixi.js";
import { SceneAds } from "../etc/sceneads";
import { TopicKey } from "../etc/topic";
import { SceneArguments } from "./scenearguments";
import { SceneDelegate } from "./scenedelegate";
import { Subscriber } from "./subscriber";
import { TopicManager } from "./topicmanager";

export class System {

    private topicManager: TopicManager = new TopicManager();
    private subscribers: Array<Subscriber> = new Array<Subscriber>();

    constructor(context: PIXI.Application) {
        this.topicManager.write(TopicKey.PixiContext, context);
        this.registerSubscriber(this.subscribers);
    }

    private registerSubscriber(list: Array<Subscriber>): void {
        list.push(new SceneDelegate(this.topicManager));
    }
    
    public onCreate(): void {
        this.subscribers.forEach(v => {
            v.create(this.topicManager);
        });

        // load title (default)
        this.topicManager.publish(TopicKey.LoadScene, SceneArguments.make(SceneAds.Title));
    }

    public onResolutionChanged(w: number, h: number): void {
        this.topicManager.publish(TopicKey.WindowSizeChanged, [w, h]);
    }

    public onDestroy(): void {
        this.subscribers.forEach(v => {
            v.destory(this.topicManager);
        });
    }
}