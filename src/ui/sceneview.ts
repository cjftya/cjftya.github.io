import * as PIXI from "pixi.js";
import { Scene } from "./scene";
import { TopicManager } from "../module/topicmanager";
import { ScenePresenter } from "./scenepresenter";
import { Arguments } from "../module/arguments";
import { Log } from "../etc/log";
import { ObjectStore } from "./objectstore/objectstore";

export abstract class SceneView extends PIXI.Container implements Scene {

    private context: PIXI.Application|null;
    private topicManager: TopicManager|null;
    private args: Arguments;
    private presenter: ScenePresenter;
    private objectStore: ObjectStore;

    constructor(context: PIXI.Application, topicManager: TopicManager, args: Arguments) {
        super();
        this.context = context;
        this.topicManager = topicManager;
        this.args = args;
        this.presenter = this.createPresenter();
        this.objectStore = this.createObjectStore();
    }

    public abstract getName(): string;

    public getArguments(): Arguments {
        return this.args;
    }

    public getContext(): PIXI.Application|null {
        return this.context;
    }

    public getTopicManager(): TopicManager|null {
        return this.topicManager;
    }

    public getPresenter(): ScenePresenter {
        return this.presenter;
    }

    public getObjectStore(): ObjectStore {
        return this.objectStore;
    }

    protected abstract createPresenter(): ScenePresenter;

    protected abstract createObjectStore(): ObjectStore;

    // call super
    public onCreate(): void {
        Log.i(this.getName(), "onCreate");
        this.presenter.onViewCreate();
        this.onBindView();
    }

    // call super
    protected onBindView(): void {
        let w = this.context?.renderer.width == undefined ? 0 : this.context?.renderer.width;
        let h = this.context?.renderer.height == undefined ? 0 : this.context?.renderer.height;
        this.interactive = true;
        this.getObjectStore().generate(w, h);
    }

    // call super
    public onResolutionChanged(w: number, h: number): void {
        this.context?.renderer.resize(w, h);
        this.getObjectStore().resize(w, h);
    }

    // call super
    public onDestroy(): void {
        Log.i(this.getName(), "onDestroy");
        this.presenter.onViewDestory();
        this.objectStore.release();
        this.removeChildren();
        this.eventNames().forEach(e => {
            this.removeAllListeners(e);
        });
        this.context = null;
        this.topicManager = null;
    }
}