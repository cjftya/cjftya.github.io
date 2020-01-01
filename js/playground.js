function setup() {
    createCanvas(windowWidth, windowHeight);
    
    this.initialize();
}

function draw() {
    //background(20, 20, 40);
  //  noStroke();

  //  stroke(1);
    textSize(52);
    fill(100, 100, 240);
    text('word', 10, 60);
}

function mousePressed() {
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
   // TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight]);
    resizeCanvas(windowWidth, windowHeight);
}

function initialize() {
    var isMobile = /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
//    TopicManager.ready().write(DEVICE_INFO.IS_MOBILE, isMobile);
}