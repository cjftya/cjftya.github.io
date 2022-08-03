import { MediaData } from "../database/mediadata";
import { TopicManager } from "../framework/topicmanager";

export interface ISceneView {
    getAddress(): string;

    getName(): string;

    getTopicManager(): TopicManager;

    getMediaData(): MediaData;
}