import * as PIXI from "pixi.js";
import { PointerEventListener } from "./pointereventlistener";

export class TextView extends PIXI.Text {

    private list: Map<string, PointerEventListener> = new Map();

    constructor(options?: PIXI.TextOptions) {
        super(options)
        this.init();
    }

    private init(): void {
        this.on("pointerdown", e => {
            this.scale.set(0.95, 0.95);
            this.alpha = 0.8;
            this.list.get("pointerdown")?.call(e);
        });
        this.on("pointerout", e => {
            if (this.scale.x < 1 && this.scale.y < 1) {
                this.scale.set(1, 1);
                this.alpha = 1;
                this.list.get("pointerout")?.call(e);
            }
        });
        this.on("pointerup", e => {
            if (this.scale.x < 1 && this.scale.y < 1) {
                this.scale.set(1, 1);
                this.alpha = 1;
                this.list.get("pointerup")?.call(e);
            }
        });
    }

    public setPointerListener(event: string, fn: PointerEventListener): void {
        this.list.set(event, fn);
    }
}