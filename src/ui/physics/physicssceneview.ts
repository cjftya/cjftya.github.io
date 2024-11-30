import * as PIXI from "pixi.js";
import { ScenePresenter } from "../scenepresenter";
import { SceneView } from "../sceneview";
import { PhysicsScenePresenter } from "./physicsscenepresenter";
import { ObjectStore } from "../objectstore/objectstore";
import { ObjectId } from "../../etc/objectid";
import { PhysicsObjectStore } from "../objectstore/physicsobjectstore";
import { PhysicsScene } from "./physicsscene";

export class PhysicsSceneView extends SceneView implements PhysicsScene {

    public getName(): string {
        return "PhysicsSceneView";
    }

    public getPresenter(): PhysicsScenePresenter {
        return super.getPresenter() as PhysicsScenePresenter;
    }

    protected createPresenter(): ScenePresenter {
        return new PhysicsScenePresenter(this);
    }

    protected createObjectStore(): ObjectStore {
        return new PhysicsObjectStore();
    }

    protected onBindView(): void {
        super.onBindView();

        let background = this.getObjectStore().read(ObjectId.Physics.Background) as PIXI.Graphics;
        this.addChild(background);
    }
}