import * as PIXI from "pixi.js";
import { SubscriberInstaller } from "../framework/subscriberinstaller";
import { TopicManager } from "../framework/topicmanager";
import * as Constant from "../etc/constant";
import * as Topic from "../etc/topic";
import { AbsSystem } from "./abssystem";
import { AbsScene } from "../scenes/absscene";
import { TitleScene } from "../scenes/title/titlescene";
import { MainScene } from "../scenes/main/mainscene";
import { DataBase } from "../database/database";

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
            .add(Topic.LOAD_SCENE, (topic, data) => {
                this.loadScene(data);
            });
    }

    public onCreate(): void {
        super.onCreate();

        this.getTopicManager().publish(Topic.LOAD_SCENE, Constant.TITLE);
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

    private loadScene(key: number): void {
        let view: AbsScene;
        switch (key) {
            case Constant.TITLE:
                view = new TitleScene(this.getContext(), this.getTopicManager());
                break;
            case Constant.MAIN:
                view = new MainScene(this.getContext(), this.getTopicManager());
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
        this.database.open(this.getDataKey(key));
    }

    private getDataKey(key: number): string {
        if (key == Constant.TITLE) {
            return Topic.DATABASE_TITLE;
        } else if (key == Constant.MAIN) {
            return Topic.DATABASE_MAIN
        }
        return "null";
    }
}