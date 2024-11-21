import * as PIXI from "pixi.js";

export interface ObjectStore {

    read(index: number): PIXI.View|undefined;

    size(): number;

    generate(w: number, h: number): void;

    resize(w: number, h: number): void;

    release(): void;
}