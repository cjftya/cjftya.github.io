var backgroundEffect;
var counter;
var tester;
var backColor;
var bubleArr;

function setup() {
    createCanvas(windowWidth, windowHeight);
    TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight]);

    this.initialize();
}

function draw() {
    background(255, 255, 245);
    noStroke();

    fill(backColor1);
    for (var b of bubleArr) {
        ellipse(b.x, b.y, b.r, b.r);
    }

//    tester.draw();

    TimeDeltaUtil.getInstance().update();

    backgroundEffect.update(TimeDeltaUtil.getInstance().getDelta());
    backgroundEffect.draw();

 //   this.drawFpsCount();
}

function drawFpsCount() {
    textSize(20);
    noStroke();
    fill(0);
    textAlign(LEFT, TOP);
    text("FPS : " + Math.floor(TimeDeltaUtil.getInstance().getFPS()), 10, 10);
}

function mousePressed() {
    // counter++;
    // if (counter == 10) {
    //     location.href = "projects/letterbe/index.html";
    // }
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
        .setPos(50, 50)
        .setScale(0.5)
        .setImageSrc("https://cjftya.github.io/assets/logo2.JPG");

    backColor1 = color(250, 190, 190);
    backColor1.setAlpha(7);

    bubleArr = [];
    var x, y, r;
    for (var i = 0; i < 8; i++) {
        x = MathUtil.randInt(50, windowWidth - 50);
        y = MathUtil.randInt(50, windowHeight - 50);
        r = MathUtil.randInt(250, 800);
        bubleArr.push({ x, y, r });
    }
    console.log(bubleArr[0].x);

    counter = 0;
}