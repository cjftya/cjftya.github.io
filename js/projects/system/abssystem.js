class AbsSystem {
    constructor() {
        this.__subscribers = null;
    }

    onCreate() {
        this.__subscribers = this.registerSubscribers();
        if (this.__subscribers != null) {
            this.__subscribers.install(TopicManager.ready());
        }
    }
    onPause() { }
    onOperate() { }
    onDestroy() {
        if(this.__subscribers != null) {
            this.__subscribers.unInstall(TopicManager.ready());
            this.__subscribers = null;
        }
    }

    onTouchUp(mx, my) { }
    onTouchDown(mx, my) { }
    onTouchMove(mx, my) { }

    registerSubscribers() {
        return null;
    }
}