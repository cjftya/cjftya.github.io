import * as PIXI from "pixi.js";

import { L } from "./etc/linker";
import { System } from "./module/system";

let system: System;

initialize()
function initialize() {
    (async () => {
        // Create a PixiJS application.
        const app = new PIXI.Application();
        const w = window.innerWidth
        const h = window.innerHeight
       
        // Intialize the application.
        await app.init({
            width: w,
            height: h,
            antialias: true,
            backgroundColor: L.colors.main_background_color});

        system = new System(app);
        
        // Then adding the application's canvas to the DOM body.
        document.body.appendChild(app.canvas);

        system.onCreate();

        window.addEventListener("resize", () => {
            system.onResolutionChanged(window.innerWidth, window.innerHeight);
        });
    })();
}

// function isMobileSystem(): boolean {
//     return /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
// }