let app;

function onSetup() {
    this.createGround();
    this.initialize();

    PIXI.loader
        .add("assets/main.jpg")
        .on("progress", loadProgressHandler)
        .load(onResourceLoaded);

    console.log("onSetup");
}

function loadProgressHandler() {
    console.log("loading");
}

function onResourceLoaded() {
    let sprite = new PIXI.Sprite(
        PIXI.loader.resources["assets/main.jpg"].texture
    );
    app.stage.addChild(sprite);
}

function createGround() {
    app = new PIXI.Application({ width: 256, height: 256 });
    app.renderer.view.style.position = "absolute";
    app.renderer.view.style.display = "block";
    app.renderer.autoDensity = true;
    app.renderer.resize(window.innerWidth, window.innerHeight);

    document.body.appendChild(app.view);
}

function initialize() {
    var isMobile = /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
}