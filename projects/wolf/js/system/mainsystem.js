class MainSystem extends AbsSystem {
    constructor(context) {
        super(context);

        this.__activeDebug = 0;
        this.__isLoading = true;

        this.__scene = null;

        const style = new PIXI.TextStyle({
            fontSize: 10,
            fill: '#000000'
        });
        this.__fpsTextView = new PIXI.Text("", style);
        this.__fpsTextView.x = 5;
        this.__fpsTextView.y = 5;
        this.getContext().stage.addChild(this.__fpsTextView);
    }

    registerSubscribers() {
        return new SubscriberInstaller()
            .add(TOPICS.LOAD_SCENE, (topic, data) => {
                this.loadScene(data);
            });
    }

    onCreate() {
        super.onCreate();

        TopicManager.ready().publish(TOPICS.LOAD_SCENE, SCENE.TITLE);

        this.__isLoading = false;
    }

    onOperate(delta) {
        if (this.isActiveDebug()) {
            this.drawDebug();
        }
        this.__scene.onUpdateWithDraw(delta);
    }

    onDestroy() {
        super.onDestroy();

        this.__scene.onDestroy();
        this.__scene = null;
    }

    onTouchUp(event) {
        if (this.__isLoading) {
            return;
        }
        this.__scene.onTouchUp(event);
    }

    onTouchDown(event) {
        if (this.__isLoading) {
            return;
        }

        if (event.data.global.x < 50) {
            this.__activeDebug++;
        }
        this.__scene.onTouchDown(event);
    }

    onTouchMove(event) {
        this.__scene.onTouchMove(event);
    }

    isActiveDebug() {
        return this.__activeDebug > 10;
    }

    drawDebug() {
        this.__fpsTextView.text = this.getContext().ticker.FPS;
    }

    loadScene(key) {
        var view;
        switch (key) {
            case SCENE.TITLE:
                view = new TitleScene(this.getContext());
                break;
            case SCENE.MAIN:
                view = new MainScene(this.getContext());
                break;
        }
        this.__scene = view;
        this.__scene.onCreate();
        console.log("loadScene : " + this.__scene.getName());
    }
}