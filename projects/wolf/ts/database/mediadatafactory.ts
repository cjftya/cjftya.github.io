import { MediaData } from "./mediadata";
import { MediaDataTitle } from "./mediadatatitle";
import { MediaDataMain } from "./mediadatamain";
import { TopicManager } from "../framework/topicmanager";
import { DataRequest } from "../etc/datakey";
import { AddressKey } from "../etc/addresskey";

export class MediaDataFactory {

    public static create(key: string, topicManager: TopicManager): MediaData {
        if (key == DataRequest.getMediaDataKey(AddressKey.Title)) {
            return new MediaDataTitle(key, topicManager);
        } else if (key == DataRequest.getMediaDataKey(AddressKey.Main)) {
            return new MediaDataMain(key, topicManager);
        }
        return null;
    }
}