import * as PIXI from "pixi.js";
import { ScenePresenter } from "../scenepresenter";
import { SceneView } from "../sceneview";
import { TitleScene } from "./titlescene";
import { TitleScenePresenter } from "./titlescenepresenter";
import { ObjectStore } from "../objectstore/objectstore";
import { TitleObjectStore } from "../objectstore/titleobjectstore";
import { ObjectId } from "../../etc/objectid";
import { SceneAds } from "../../etc/sceneads";
import { TextView } from "../widget/textview";
import { Log } from "../../etc/log";

export class TitleSceneView extends SceneView implements TitleScene {

    public getName(): string {
        return "TitleSceneView";
    }

    public getPresenter(): TitleScenePresenter {
        return super.getPresenter() as TitleScenePresenter;
    }

    protected createPresenter(): ScenePresenter {
        return new TitleScenePresenter(this);
    }

    protected createObjectStore(): ObjectStore {
        return new TitleObjectStore();
    }

    protected onBindView(): void {
        super.onBindView();

        let background = this.getObjectStore().read(ObjectId.Title.Background) as PIXI.Graphics;
        this.addChild(background);

        let wcardTextView = this.getObjectStore().read(ObjectId.Title.WCardText) as TextView;
        wcardTextView.setPointerListener("pointerup", e => {
            this.getPresenter().moveScene(SceneAds.WCard);
        });
        this.addChild(wcardTextView);

        let physicsTextView = this.getObjectStore().read(ObjectId.Title.PhysicsText) as TextView;
        physicsTextView.setPointerListener("pointerup", e => {
            this.getPresenter().moveScene(SceneAds.Physics);
        });
        this.addChild(physicsTextView);
    }
}