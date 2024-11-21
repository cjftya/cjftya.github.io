import * as PIXI from "pixi.js";
import { ObjectStore } from "./objectstore";

export abstract class SceneObjectStore implements ObjectStore {

    protected list: Map<number, PIXI.View> = new Map<number, PIXI.View>();
    private width?: number;
    private height?: number;

    public read(index: number): PIXI.View {
        let v = this.list.get(index);
        if (v == undefined) { 
            throw new Error("key not found in map");
        }
        return v;
    }

    public size(): number {
        return this.list.size;
    }

    public resize(w: number, h: number): void {
        this.updateSize(w, h);
        this.resizeViews();
    }

    public generate(w: number, h: number): void {
        this.updateSize(w, h);
        this.createViews();
    }

    public release(): void {
        this.list.forEach((v, k) => {
            if (v instanceof PIXI.ViewContainer) {
                v.removeAllListeners();
            }
        });
    }

    private updateSize(w: number, h: number): void {
        this.width = w;
        this.height = h;
    }

    protected getWidth(): number {
        return this.width == undefined ? 0 : this.width;
    }

    protected getHeight(): number {
        return this.height == undefined ? 0 : this.height;
    }

    protected abstract createViews(): void;
    protected abstract resizeViews(): void;
}