import * as PIXI from "pixi.js";

export interface PointerEventListener {
    call(event: PIXI.FederatedPointerEvent): void;
}