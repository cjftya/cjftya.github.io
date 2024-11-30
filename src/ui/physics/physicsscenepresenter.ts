import { TopicListener } from "../../module/topicmanager";
import { ScenePresenter } from "../scenepresenter";
import { PhysicsScene } from "./physicsscene";

export class PhysicsScenePresenter extends ScenePresenter {

    constructor(scene: PhysicsScene) {
        super(scene);
    }

    protected registerSubscriber(list: Map<string, TopicListener>): void {
        // do nothing
    }
}