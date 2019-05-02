class MainScene extends AbsScene {
    constructor() {
        super();

        this.setPresenter(new MainPresenter(this));

        this.px = -30;
    }

    onCreate() {
    }

    onPause() {
    }

    onStart() {
    }

    onUpdate(timeDelta) {
        this.px += 2;
        if (this.px >= windowWidth) {
            this.px = -30;
        }
    }

    onDraw() {
        background(10, 10, 80);
        noStroke();

        fill(100, 100, 200);
        ellipse(this.px, 200, 15, 15);
    }

    onEnd() {
    }

    onDestroy() {
    }

    onTouchDown(tx, ty) {
        this.getPresenter().onTouchDown(tx, ty);
    }

    onTouchUp(tx, ty) {
        this.getPresenter().onTouchUp(tx, ty);
    }

    onTouchMove(tx, ty) {
        this.getPresenter().onTouchMove(tx, ty);
    }
}