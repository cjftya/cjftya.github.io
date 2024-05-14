import * as PIXI from "pixi.js";

import { L } from "./etc/constlinker";

initialize()

function initialize() {
    (async () => {
        // Create a PixiJS application.
        const app = new PIXI.Application();
        const w = window.innerWidth // isMobile ? window.innerWidth : 500
        const h = window.innerHeight  //isMobile ? window.innerHeight : 630
       
        // Intialize the application.
        await app.init({
            width: w,
            height: h,
            antialias: true,
            backgroundColor: L.colors.basic_background_color});
        
        // Then adding the application's canvas to the DOM body.
        document.body.appendChild(app.canvas);
    })();
}

function isMobileSystem(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
}