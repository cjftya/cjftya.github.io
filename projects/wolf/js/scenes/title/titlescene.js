class TitleScene extends AbsScene {
    constructor(context) {
        super(context);

        this.__click = false;

        this.__size = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);

        // test code
        this.__testObject = new PIXI.Graphics();
        this.__count = 0;
    }

    getName() {
        return "TitleScene";
    }

    onCreate() {
        this.getContext().stage.addChild(this.__testObject);
        this.__testObject.x = this.__size.width / 2;
        this.__testObject.y = this.__size.height / 2;
    }

    onUpdateWithDraw(delta) {
        this.__count += 0.1;

        this.__testObject.clear();
        this.__testObject.lineStyle(10, 0xff0000, 1);
        this.__testObject.beginFill(0xffFF00, 0.5);

        this.__testObject.moveTo(0, 0);
        this.__testObject.lineTo(this.__size.width / 4, this.__size.height / 4);
        this.__testObject.closePath();

        this.__testObject.rotation = this.__count * 0.1;
    }

    onDestroy() {
    }

    onTouchDown(event) {
        this.__click = true;

    }

    onTouchUp(event) {
        this.__click = false;

    }

    onTouchMove(event) {

    }
}