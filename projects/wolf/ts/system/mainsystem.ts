import * as PIXI from "pixi.js";
import { SubscriberInstaller } from "../framework/subscriberinstaller";
import { TopicManager } from "../framework/topicmanager";
import { AbsSystem } from "./abssystem";
import { AbsScene } from "../scenes/absscene";
import { TitleScene } from "../scenes/title/titlescene";
import { MainScene } from "../scenes/main/mainscene";
import { DataBase } from "../database/database";
import { TopicKey } from "../etc/topickey";
import { L } from "../etc/constlinker";
import { AddressKey } from "../etc/addresskey";
import { AddressUtil } from "../framework/addressbuilder";

export class MainSystem extends AbsSystem {

    private activeDebug: number = 0;
    private isLoading: boolean = true;

    private scene: AbsScene;
    private fpsTextView?: PIXI.Text;
    private database: DataBase;

    constructor(context: PIXI.Application, topicManager: TopicManager) {
        super(context, topicManager);

        this.database = new DataBase(topicManager);

        const style = new PIXI.TextStyle({
            fontSize: 18,
            fill: '#ffffff'
        });
        this.fpsTextView = new PIXI.Text("", style);
        this.fpsTextView.position.set(5, 5);
        this.addChild(this.fpsTextView);
    }

    protected registerSubscribers(): SubscriberInstaller {
        return new SubscriberInstaller()
            .add(TopicKey.LOAD_SCENE, (topic, data) => {
                this.loadScene(data);
            });
    }

    public onCreate(): void {
        super.onCreate();

        this.getTopicManager().publish(TopicKey.LOAD_SCENE, AddressKey.Title);
        this.isLoading = false;
    }

    public onOperate(delta: number): void {
        if (this.isLoading) {
            return;
        }
        if (this.isActiveDebug()) {
            this.drawDebug();
        }
        if (this.scene != null) {
            this.scene.onUpdateWithDraw(delta);
        }
    }

    public onDestroy(): void {
        super.onDestroy();

        this.database.close();

        this.scene.onDestroy();
        this.scene = null;
    }

    public onTouchUp(event: PIXI.InteractionEvent): void {
        if (this.isLoading) {
            return;
        }
        if (this.scene != null) {
            this.scene.onTouchUp(event);
        }
    }

    public onTouchDown(event: PIXI.InteractionEvent): void {
        if (this.isLoading) {
            return;
        }
        if (event.data.global.x < 50) {
            this.activeDebug++;
        }
        if (this.scene != null) {
            this.scene.onTouchDown(event);
        }
    }

    public onTouchMove(event: PIXI.InteractionEvent): void {
        if (this.scene != null) {
            this.scene.onTouchMove(event);
        }
    }

    private isActiveDebug(): boolean {
        return this.activeDebug > 10;
    }

    private drawDebug(): void {
        this.fpsTextView.text = this.getContext().ticker.FPS;
    }

    private loadScene(key: string): void {
        const address = AddressUtil.getAddress(key);

        let view: AbsScene;
        switch (address) {
            case AddressKey.Title:
                view = new TitleScene(key, this.getContext(), this.getTopicManager());
                break;
            case AddressKey.Main:
                view = new MainScene(key, this.getContext(), this.getTopicManager());
                break;
        }
        if (this.scene != null) {
            this.scene.onDestroy();
        }
        if (view != null) {
            this.scene = view;
            this.scene.onCreate();
            console.log("loadScene : " + this.scene.getName());
        } else {
            console.log("view is null : " + key);
        }
        this.database.open(address);
    }
}