import * as PIXI from "pixi.js";
import { ScenePresenter } from "../scenepresenter";
import { SceneView } from "../sceneview";
import { WCardScene } from "./wcardscene";
import { WCardScenePresenter } from "./wcardscenepresenter";
import { ObjectStore } from "../objectstore/objectstore";
import { WCardObjectStore } from "../objectstore/wcardobjectstore";
import { ObjectId } from "../../etc/objectid";

export class WCardSceneView extends SceneView implements WCardScene {

    public getName(): string {
        return "WCardSceneView";
    }

    public getPresenter(): WCardScenePresenter {
        return super.getPresenter() as WCardScenePresenter;
    }

    protected createPresenter(): ScenePresenter {
        return new WCardScenePresenter(this);
    }

    protected createObjectStore(): ObjectStore {
        return new WCardObjectStore();
    }

    protected onBindView(): void {
        super.onBindView();
        
        let background: PIXI.Graphics = this.getObjectStore().read(ObjectId.WCard.Background) as PIXI.Graphics;
        this.addChild(background);
    }
}