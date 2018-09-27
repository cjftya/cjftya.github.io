class SceneTitle extends AbsScene {
    constructor(attr) {
        super(attr);

        this.__rainComponent = new Rain();
    }

    onStart() {
        this.__rainComponent.setArea(500, 500);
        this.__rainComponent.onStart();
    }

    onUpdate(timeDelta) {
        this.__rainComponent.onUpdate(timeDelta);
    }

    onDraw() {
        background(10, 10, 10);
        noStroke();

        this.__rainComponent.onDraw();

        // push();
        // translate(width * 0.2, height * 0.5);
        // rotate(frameCount / 200.0);

        // var angle = TWO_PI / 3;
        // beginShape();
        // for (var a = 0; a < TWO_PI; a += angle) {
        //     var sx = cos(a) * 82;
        //     var sy = sin(a) * 82;
        //     vertex(sx, sy);
        // }
        // endShape(CLOSE);

        // pop();
    }

    onTouchDown(tx, ty) {
    }

    onTouchUp(tx, ty) {}

    onTouchMove(tx, ty) {
    }
}