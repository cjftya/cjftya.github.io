var __fadeInOut = null;
var __contentsScene = false;
var __selectedContents = "";
var __bgmList = [];
var __writeParticle = null;
var __dom = null;

function load(element) {
    __dom = element;
    // element.documentElement.requestFullscreen();
    // console.log(element.requestFullScreen);
    // if(element.requestFullScreen) {
    //     element.requestFullScreen();
    // } else if(element.webkitRequestFullScreen ) {
    //     element.webkitRequestFullScreen();
    // } else if(element.mozRequestFullScreen) {
    //     element.mozRequestFullScreen();
    // } else if (element.msRequestFullscreen) {
    //     element.msRequestFullscreen(); // IE
    // }
}

function preload() {
    __bgmList.push(new Audio( "https://cjftya.github.io/assets/audio/contents_bgm_1.mp3"));
    __bgmList.push(new Audio( "https://cjftya.github.io/assets/audio/contents_bgm_2.mp3"));
    //font = loadFont("https://cjftya.github.io/assets/font/Gabia-Solmee-Regular.ttf");
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    this.__pinLock = new PinLock(patternResult);
    this.__particleCont = new ParticleController();
    __fadeInOut = new FadeInOut(fadeInOutResult);

    __writeParticle = new WriteEffect();
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
    __writeParticle.update();
    __writeParticle.draw();
}

function mousePressed() {
    this.__pinLock.pick(mouseX, mouseY);
    __dom.documentElement.requestFullscreen();
}

function mouseReleased() {
    this.__pinLock.release(mouseX, mouseY);
}

function mouseDragged() {
    this.__pinLock.drag(mouseX, mouseY);
    
    this.__writeParticle.active(mouseX, mouseY);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function patternResult(data) {
    __selectedContents = data;
    __fadeInOut.fadeIn();
}

function fadeInOutResult(data) {
    __contentsScene = true;
    __fadeInOut.fadeOut();
}