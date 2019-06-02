function preload() {
    //font = loadFont("https://cjftya.github.io/assets/font/Gabia-Solmee-Regular.ttf");

}

function setup() {
    createCanvas(windowWidth, windowHeight);

    this.__pinLock = new PinLock(patternResolve);
}

function draw() {
    background(255,255, 255);
    noStroke();

    this.__pinLock.draw();
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

function patternResolve(data) {
    alert(data);
}