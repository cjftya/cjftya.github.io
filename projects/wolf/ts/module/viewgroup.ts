import * as PIXI from "pixi.js";
import { View } from "./view";

export class ViewGroup extends View {

    private container: PIXI.Container;
    private groups: Array<View>;

    constructor(context: PIXI.Application) {
        super(context);
        this.groups = [];
        this.container = new PIXI.Container();
        context.stage.addChild(this.container);
    }

    public getPixiView(): PIXI.DisplayObject {
        return this.container;
    }

    // Call super
    public onCreate(): void {
        for (const child of this.groups) {
            child.onCreate();
        }
    }

    public getChildCount(): number {
        return this.container.children.length;
    }

    protected addChild(v: PIXI.DisplayObject | View) {
        if (v instanceof View) {
            this.groups.push(v);
            this.container.addChild(v.getPixiView());
        } else if (v instanceof PIXI.DisplayObject) {
            this.container.addChild(v);
        }
    }

    // Call super
    public onDestroy(): void {
        super.onDestroy();
        for (const child of this.groups) {
            child.onDestroy();
        }
        this.container.destroy();
    }
}