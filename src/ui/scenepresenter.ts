import { Subscriber } from "../module/subscriber";
import { TopicManager } from "../module/topicmanager";
import { Scene } from "./scene";

export abstract class ScenePresenter extends Subscriber {

    protected scene: Scene;
    protected topicManager: TopicManager|null;

    constructor(scene: Scene) {
        super();
        this.scene = scene;
        this.topicManager = scene.getTopicManager();
    }

    // call super
    public onViewCreate(): void {
        this.create(this.topicManager);
    }

    // call super
    public onViewDestory(): void  {
        this.destory(this.topicManager);
    }
}