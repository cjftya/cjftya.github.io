import { MediaData } from "./mediadata";
import * as Const from "../etc/constant";
import * as Topic from "../etc/topic";
import { MediaDataTitle } from "./mediadatatitle";
import { MediaDataMain } from "./mediadatamain";
import { TopicManager } from "../framework/topicmanager";

export class MediaDataFactory {

    public static cretae(key: number, topicManager: TopicManager): MediaData {
        switch (key) {
            case Const.TITLE:
                return new MediaDataTitle(Topic.MEDIA_DATA_TITLE, topicManager);
            case Const.MAIN:
                return new MediaDataMain(Topic.MEDIA_DATA_MAIN, topicManager);
            default:
                return null;
        }
    }
}