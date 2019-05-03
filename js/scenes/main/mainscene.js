class MainScene extends AbsScene {
    constructor() {
        super();

        this.__circle = null;
    }

    onCreate() {
        this.setPresenter(new MainPresenter(this));

        this.__circle = new Circle(-30, 200, 20);
    }

    onPause() {
    }

    onStart() {
    }

    onUpdate(timeDelta) {
        this.__circle.updateVel(timeDelta);
        this.__circle.updatePos(timeDelta);
        if (this.__circle.pos.x >= windowWidth) {
            this.__circle.pos.x = -30;
        }
    }

    onDraw() {
        background(0, 0, 0);
        noStroke();

        this.__circle.draw();
    }

    onEnd() {
    }

    onDestroy() {
    }

    onTouchDown(tx, ty) {
        this.__circle.addForce(2000, 0);

        this.getPresenter().onTouchDown(tx, ty);
    }

    onTouchUp(tx, ty) {
        this.getPresenter().onTouchUp(tx, ty);
    }

    onTouchMove(tx, ty) {
        this.getPresenter().onTouchMove(tx, ty);
    }
}