import * as PIXI from "pixi.js";
import { L } from "../../etc/linker";
import { SceneObjectStore } from "./sceneobjectstore";
import { ObjectId } from "../../etc/objectid";
import { TextView } from "../widget/textview";

export class TitleObjectStore extends SceneObjectStore {

    protected createViews(): void {
        this.list.set(ObjectId.Title.Background, this.createBackground());
        this.list.set(ObjectId.Title.WCardText, this.createWCardText());
    }

    protected resizeViews(): void {
        let background: PIXI.Graphics = this.read(ObjectId.Title.Background) as PIXI.Graphics;
        background.width = this.getWidth();
        background.height = this.getHeight();
    }

    private createBackground(): PIXI.View {
        const background = new PIXI.Graphics();
        background.rect(0, 0, this.getWidth(), this.getHeight());
        background.fill(L.colors.title_scene_background_color);
        return background;
    }

    private createWCardText(): PIXI.View {
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 36,
            fill: '#ffffff',
            fontWeight: 'lighter'
        });
        // const text = new PIXI.Text({
        //     text: "W.Card",
        //     style,
        // });
        const text = new TextView({
            text: "W.Card",
            style,
        });
        text.interactive = true;
        text.anchor.set(0.5, 0.5);
        text.x = this.getWidth() / 2;
        text.y = this.getHeight() / 2;
        return text;
    }
}