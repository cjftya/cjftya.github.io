var timeModule;

function setup() {
    onStart();
}

function draw() {
    timeModule.update();
    onUpdate(timeModule.getDelta());
    onDraw();
}

function onStart() {
    createCanvas(500,500);
  //  noLoop();
    timeModule = new TimeDelta();
}

function onPause() {

}

function onUpdate(timeDelta) {
 //   console.log(frameCount);
}

function onStop() {

}

function onDraw() {
    background(100);
    push();
    translate(width*0.2, height*0.5);
    rotate(frameCount / 200.0);
    polygon(0, 0, 82, 3); 
    pop();
}

function polygon(x, y, radius, npoints) {
    var angle = TWO_PI / npoints;
    beginShape();
    for (var a = 0; a < TWO_PI; a += angle) {
      var sx = x + cos(a) * radius;
      var sy = y + sin(a) * radius;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }