import * as PIXI from "pixi.js";
import { Size } from "./support/size";
import { TopicManager } from "./framework/topicmanager";
import { MainSystem } from "./system/mainsystem";
import { AbsSystem } from "./system/abssystem";
import { TopicKey } from "./etc/topickey";
import { L } from "./etc/constlinker";

initialize();

function initialize(): void {
    const topicManager: TopicManager = new TopicManager();
    const app = createPixiContext(topicManager);

    topicManager.write(TopicKey.CONTEXT, app);

    let systemView: AbsSystem = new MainSystem(app, topicManager);
    app.stage.interactive = true;
    // window.app = app;
    app.renderer.plugins.interaction.on('pointerdown', (e: PIXI.InteractionEvent) => systemView.onTouchDown(e));
    app.renderer.plugins.interaction.on('pointerup', (e: PIXI.InteractionEvent) => systemView.onTouchUp(e));
    app.renderer.plugins.interaction.on('pointermove', (e: PIXI.InteractionEvent) => systemView.onTouchMove(e));

    document.body.appendChild(app.view);

    // life cycle: onCreate()
    systemView.onCreate();

    app.ticker.add((delta) => {
        systemView.onOperate(delta);
    });
}

function createPixiContext(topicManager: TopicManager): PIXI.Application {
    const isMobile = isMobileSystem();
    topicManager.write(TopicKey.IS_MOBILE, isMobile);

    const w = isMobile ? window.innerWidth : 500;
    const h = isMobile ? window.innerHeight : 630;
    topicManager.write(TopicKey.WINDOW_SIZE, new Size(w, h));

    return new PIXI.Application({
        width: w,
        height: h,
        antialias: true,
        backgroundColor: L.colors.basic_background_color
    });
}

function isMobileSystem(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
}