import * as PIXI from "pixi.js";

export interface PointerEventListener {
    (event: PIXI.FederatedPointerEvent): void;
}