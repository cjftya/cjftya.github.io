this.initialize();

function initialize() {
    let app = createPixiContext();

    let systemView = new MainSystem(app);
    app.stage.interactive = true;
    window.app = app;
    app.renderer.plugins.interaction.on('pointerdown', e => systemView.onTouchDown(e));
    app.renderer.plugins.interaction.on('pointerup', e => systemView.onTouchUp(e));
    app.renderer.plugins.interaction.on('pointermove', e => systemView.onTouchMove(e));

    document.body.appendChild(app.view);

    TopicManager.ready().write(STAGE_INFO.CONTEXT, app);

    // life cycle: onCreate()
    systemView.onCreate();

    app.ticker.add((delta) => {
        systemView.onOperate(delta);
    });
}

function createPixiContext() {
    var isMobile = this.isMobileSystem();
    TopicManager.ready().write(DEVICE_INFO.IS_MOBILE, isMobile);

    var w = isMobile ? window.screen.width : 380;
    var h = isMobile ? window.screen.height : 570;
    TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, { width: w, height: h });

    return new PIXI.Application({
        width: w,
        height: h,
        antialias: true,
        backgroundColor: COLOR.BACKGROUND
    });
}

function isMobileSystem() {
    return /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
}