import { MediaData } from "./mediadata";
import { MediaDataTitle } from "./mediadatatitle";
import { MediaDataMain } from "./mediadatamain";
import { TopicManager } from "../framework/topicmanager";
import { L } from "../etc/constlinker";
import { TopicKey } from "../etc/topickey";

export class MediaDataFactory {

    public static cretae(key: number, topicManager: TopicManager): MediaData {
        switch (key) {
            case L.values.title_key:
                return new MediaDataTitle(TopicKey.MEDIA_DATA_TITLE, topicManager);
            case L.values.main_key:
                return new MediaDataMain(TopicKey.MEDIA_DATA_MAIN, topicManager);
            default:
                return null;
        }
    }
}