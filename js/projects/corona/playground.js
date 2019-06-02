var __fadeInOut = null;
var __contentsScene = false;
var __selectedContents = "";

function preload() {
    //font = loadFont("https://cjftya.github.io/assets/font/Gabia-Solmee-Regular.ttf");

}

function setup() {
    createCanvas(windowWidth, windowHeight);

    this.__pinLock = new PinLock(patternResult);
    this.__particleCont = new ParticleController();
}

function draw() {
    background(255, 255, 255);
    noStroke();

    if (!__contentsScene) {
        this.__particleCont.update();
        this.__particleCont.draw();
        this.__pinLock.draw();
    } else {
        if (__selectedContents == "__myGirlPattern") {
            fill(255, 0, 0, 50);
            ellipse(100, 100, 50, 50);
        } else if (__selectedContents == "__motherOfMyGirlPattern") {
            fill(0, 0, 255, 50);
            rect(100, 100, 100, 100);
        }
    }
    if (__fadeInOut != null) {
        __fadeInOut.update();
        __fadeInOut.draw();
    }
}

function mousePressed() {
    this.__pinLock.pick(mouseX, mouseY);
}

function mouseReleased() {
    this.__pinLock.release(mouseX, mouseY);
}

function mouseDragged() {
    this.__pinLock.drag(mouseX, mouseY);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function patternResult(data) {
    __selectedContents = data;
    __fadeInOut = new FadeInOut(fadeInOutResult);
    __fadeInOut.fadeIn();
}

function fadeInOutResult(data) {
    __contentsScene = true;
    __fadeInOut.fadeOut();
    console.log(data);
}