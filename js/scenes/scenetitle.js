class SceneTitle {
    constructor() {
    }

    onStart() {

    }

    onUpdate() {
        
    }

    onDraw() {
        background(110, 130, 150);
        noStroke();
        push();
        translate(width * 0.2, height * 0.5);
        rotate(frameCount / 200.0);

        var angle = TWO_PI / 3;
        beginShape();
        for (var a = 0; a < TWO_PI; a += angle) {
            var sx = cos(a) * 82;
            var sy = sin(a) * 82;
            vertex(sx, sy);
        }
        endShape(CLOSE);

        pop();
    }
}