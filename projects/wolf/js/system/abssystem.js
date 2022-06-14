class AbsSystem {
    constructor(context) {
        this.__context = context;
        this.__subscribers = null;
    }

    getContext() {
        return this.__context;
    }

    addChild(v) {
        this.__context.stage.addChild(v);
    }

    onCreate() {
        this.__subscribers = this.registerSubscribers();
        if (this.__subscribers != null) {
            this.__subscribers.install(TopicManager.ready());
        }
    }
    onOperate(delta) { }
    onDestroy() {
        if (this.__subscribers != null) {
            this.__subscribers.unInstall(TopicManager.ready());
            this.__subscribers = null;
        }
        this.__context = null;
    }

    onTouchUp(event) { }
    onTouchDown(event) { }
    onTouchMove(event) { }

    registerSubscribers() {
        return null;
    }
}