import * as PIXI from "pixi.js";

export class View {

    private context: PIXI.Application;

    constructor(context: PIXI.Application) {
        this.context = context;
    }

    protected getContext(): PIXI.Application {
        return this.context;
    }

    public getPixiView(): PIXI.DisplayObject {
        return null;
    }

    public onCreate(): void {
    }

    // Call super
    public onDestroy(): void {
        this.context = null;
    }

    public onUpdateWithDraw(delta: number): void {
    }

    public onTouchUp(event: PIXI.InteractionEvent): void { }
    public onTouchDown(event: PIXI.InteractionEvent): void { }
    public onTouchMove(event: PIXI.InteractionEvent): void { }
}