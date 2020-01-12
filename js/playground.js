var backgroundEffect;
var counter;
var tester;

function setup() {
    createCanvas(windowWidth, windowHeight);
    TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight]);

    this.initialize();
}

function draw() {
    background(20, 20, 40);
    noStroke();

    tester.draw();

    TimeDeltaUtil.getInstance().update();

    backgroundEffect.update(TimeDeltaUtil.getInstance().getDelta());
    backgroundEffect.draw();

    this.drawFpsCount();
}

function drawFpsCount() {
    textSize(20);
    noStroke();
    fill(240);
    textAlign(LEFT, TOP);
    text("FPS : " + Math.floor(TimeDeltaUtil.getInstance().getFPS()), 10, 10);
}

function mousePressed() {
    counter++;
    if(counter == 10) {
       location.href = "projects/letterbe/index.html";        
    }
    //    location.replace("projects/viola/index.html");
    //    location.replace("projects/letterbe/index.html");
}

function mouseReleased() {
}

function mouseDragged() {
}

function mouseMoved() {
}

function windowResized() {
    TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight]);
    resizeCanvas(windowWidth, windowHeight);
}

function initialize() {
    var isMobile = /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
    TopicManager.ready().write(DEVICE_INFO.IS_MOBILE, isMobile);

    backgroundEffect = EffectFactory.createParticle(Particle.Snow);
    tester = new ImageView()
        .setImageSrc("https://cjftya.github.io/assets/logo.png")
        .setWidth(200);

    counter = 0;
}