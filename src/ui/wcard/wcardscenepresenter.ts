import { TopicListener } from "../../module/topicmanager";
import { ScenePresenter } from "../scenepresenter";
import { WCardScene } from "./wcardscene";

export class WCardScenePresenter extends ScenePresenter {

    constructor(scene: WCardScene) {
        super(scene);
    }

    protected registerSubscriber(list: Map<string, TopicListener>): void {
        // do nothing
    }
}