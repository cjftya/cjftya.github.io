class MainSystem extends AbsSystem {
    constructor(context) {
        super(context);

        this.__activeDebug = 0;
        this.__isLoading = true;

        this.__scene = null;

        const style = new PIXI.TextStyle({
            fontSize: 18,
            fill: '#ffffff'
        });
        this.__fpsTextView = new PIXI.Text("", style);
        this.__fpsTextView.position.set(5, 5);
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
        if (this.__isLoading) {
            return;
        }
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
        if (this.__scene != null) {
            this.__scene.onDestroy();
        }
        if (view != null) {
            this.__scene = view;
            this.__scene.onCreate();
            console.log("loadScene : " + this.__scene.getName());
        } else {
            console.log("view is null : " + key);
        }
    }
}