import * as PIXI from "pixi.js";
import { L } from "./const/linker";
import { Log } from "./const/log";

initialize()
function initialize() {
    (async () => {
        // Create a PixiJS application.
        const app = new PIXI.Application();
        const w = window.innerWidth
        const h = window.innerHeight
        Log.i("index", `window size: ${window.innerWidth}x${window.innerHeight}`);
       
        // Intialize the application.
        await app.init({
            width: w,
            height: h,
            antialias: true,
            backgroundColor: L.colors.main_background_color});

        // Then adding the application's canvas to the DOM body.
        document.body.appendChild(app.canvas);

        window.addEventListener("resize", () => {
            app.renderer.resize(window.innerWidth, window.innerHeight);
            Log.i("index", `window size: ${window.innerWidth}x${window.innerHeight}`);
        });
    })();
}