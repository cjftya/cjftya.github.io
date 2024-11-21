import * as PIXI from "pixi.js";
import { SceneObjectStore } from "./sceneobjectstore";
import { L } from "../../etc/linker";
import { ObjectId } from "../../etc/objectid";

export class WCardObjectStore extends SceneObjectStore {

    protected createViews(): void {
        this.list.set(ObjectId.WCard.Background, this.createBackground());
    }

    protected resizeViews(): void {
        let background: PIXI.Graphics = this.read(ObjectId.WCard.Background) as PIXI.Graphics;
        background.width = this.getWidth();
        background.height = this.getHeight();
    }

    private createBackground(): PIXI.View {
        let background = new PIXI.Graphics();
        background.rect(0, 0, this.getWidth(), this.getHeight());
        background.fill(L.colors.wcard_scene_background_color);
        return background;
    }
}