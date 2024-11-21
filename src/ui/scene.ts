import * as PIXI from "pixi.js";
import { TopicManager } from "../module/topicmanager";
import { ScenePresenter } from "./scenepresenter";
import { Arguments } from "../module/arguments";
import { ObjectStore } from "./objectstore/objectstore";

export interface Scene {
    
    getContext(): PIXI.Application|null;

    getTopicManager(): TopicManager|null;

    getPresenter(): ScenePresenter;

    getArguments(): Arguments;

    getObjectStore(): ObjectStore;

}