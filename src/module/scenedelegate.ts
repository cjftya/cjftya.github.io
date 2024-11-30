import * as PIXI from "pixi.js";
import { SceneAds } from "../etc/sceneads";
import { TopicKey } from "../etc/topic";
import { SceneView } from "../ui/sceneview";
import { SceneArguments } from "./scenearguments";
import { Subscriber } from "./subscriber";
import { TopicListener, TopicManager } from "./topicmanager";
import { WCardSceneView } from "../ui/wcard/wcardsceneview";
import { PhysicsSceneView } from "../ui/physics/physicssceneview";
import { TitleSceneView } from "../ui/title/titlesceneview";
import { Log } from "../etc/log";

export class SceneDelegate extends Subscriber {

    private TAG: string = "SceneDelegate";
    
    private topicManager: TopicManager;
    private scene?: SceneView|null;

    constructor(topicManager: TopicManager) { 
        super();
        this.topicManager = topicManager;
    }

    protected registerSubscriber(list: Map<string, TopicListener>): void {
        list.set(TopicKey.LoadScene, (k, d) => this.loadScene(d));
        list.set(TopicKey.WindowSizeChanged, (k, d) => this.handleWindowSizeChanged(d[0], d[1]));
    }

    private handleWindowSizeChanged(w: number, h: number): void {
        if (this.scene != null) {
            this.scene.onResolutionChanged(w, h);
        }
    }

    private loadScene(sceneArgs: SceneArguments): void {
        let view: SceneView|null = null;
        let address = sceneArgs.getAddress();
        let context: PIXI.Application = this.topicManager.read(TopicKey.PixiContext);
        switch (address) {
            case SceneAds.Title:
                view = new TitleSceneView(context, this.topicManager, sceneArgs.getArguments());
                break;
            case SceneAds.WCard:
                view = new WCardSceneView(context, this.topicManager, sceneArgs.getArguments());
                break;
            case SceneAds.Physics:
                view = new PhysicsSceneView(context, this.topicManager, sceneArgs.getArguments());
                break;
        }
        if (this.scene != null) {
            context.stage.removeChild(this.scene);
            this.scene.onDestroy();
        }
        if (view != null) {
            this.scene = view;
            this.scene.onCreate();
            context.stage.addChild(this.scene);
            Log.d(this.TAG, "loadScene : " + this.scene.getName());
        } else {
            Log.d(this.TAG, "view is null");
        }
        // this.database.open(address);
    }
}