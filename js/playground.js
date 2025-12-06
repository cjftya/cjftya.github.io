function setup() {
    this.initialize();
    // this.decidePage();
    location.href = "projects/viola/index.html";
}

function draw() {
}

function mousePressed() {
    // 마우스가 눌렸을 때 호출
    console.log('mousePressed:', mouseX, mouseY);
}

function mouseReleased() {
    // 마우스가 떼어졌을 때 호출
    console.log('mouseReleased:', mouseX, mouseY);
}

function mouseDragged() {
    // 마우스를 드래그할 때 호출
    console.log('mouseDragged:', mouseX, mouseY);
}

function mouseMoved() {
    // 마우스가 움직일 때 호출
    // 너무 자주 호출되므로 주석 처리
    // console.log('mouseMoved:', mouseX, mouseY);
}

function windowResized() {
    TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight]);
    resizeCanvas(windowWidth, windowHeight);
}

function initialize() {
    var isMobile = /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
    TopicManager.ready().write(DEVICE_INFO.IS_MOBILE, isMobile);
}

function decidePage() {
    var isMobile = TopicManager.ready().read(DEVICE_INFO.IS_MOBILE);
    if (isMobile) {
        location.href = "projects/weddingcard/index.html";
    } else {
        location.href = "projects/viola/index.html";
    }
}