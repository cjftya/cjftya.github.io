import { MediaData } from "../database/mediadata";
import { TopicManager } from "../framework/topicmanager";

export interface ISceneView {
    getKey(): number;

    getTopicManager(): TopicManager;

    getMediaData(): MediaData;
}