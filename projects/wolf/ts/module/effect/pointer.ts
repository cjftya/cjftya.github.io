import * as PIXI from "pixi.js";
import { View } from "../view";

export class Pointer extends View {
    constructor(context: PIXI.Application) {
        super(context);
    }

    public getPixiView(): PIXI.DisplayObject {
        return null;
    }
}

// class Pointer extends View {
//     constructor(context) {
//         super(context);

//         this.__scaleTarget = 0;
//         this.__alphaTarget = 0;
//         this.__object = new PIXI.Graphics();
//     }

//     getPixiView() {
//         return this.__object;
//     }

//     reset() {
//         this.__alphaTarget = -1;
//         this.__scaleTarget = -1;
//         this.__object.position.set(-100, -100);
//         this.__object.scale.x = 1;
//         this.__object.scale.y = 1;
//         this.__object.alpha = 1;
//     }

//     ready(x, y) {
//         this.__alphaTarget = 0;
//         this.__scaleTarget = 1.5;
//         this.__object.clear();
//         this.__object.beginFill(0xfcfcfc, 1);
//         this.__object.drawCircle(0, 0, 15);
//         this.__object.endFill();
//         this.__object.position.set(x, y);
//     }

//     onUpdateWithDraw(delta) {
//         if (this.__alphaTarget >= 0) {
//             this.__object.alpha += ((this.__alphaTarget - this.__object.alpha) * 0.1) * delta;
//             var s = ((this.__scaleTarget - this.__object.scale.x) * 0.1) * delta;
//             this.__object.scale.x += s;
//             this.__object.scale.y += s;

//             if (this.__object.alpha < 0.0001) {
//                 this.reset();
//             }
//         }
//     }
// }