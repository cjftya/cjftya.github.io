import { TopicKey } from "../../etc/topic";
import { SceneArguments } from "../../module/scenearguments";
import { TopicListener } from "../../module/topicmanager";
import { ScenePresenter } from "../scenepresenter";
import { TitleScene } from "./titlescene";

export class TitleScenePresenter extends ScenePresenter {

    constructor(scene: TitleScene) {
        super(scene);
    }

    protected registerSubscriber(list: Map<string, TopicListener>): void {
        // do nothing
    }

    public moveScene(key: string): void {
        this.topicManager?.publish(TopicKey.LoadScene, SceneArguments.make(key));
    }
}