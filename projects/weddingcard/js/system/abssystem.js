class AbsSystem {
    constructor() {
        this.__subscribers = null;
    }

    onPreload() { }
    onCreate() {
        this.__subscribers = this.registerSubscribers();
        if (this.__subscribers != null) {
            this.__subscribers.install(TopicManager.ready());
        }
    }
    onOperate() { }
    onDestroy() {
        if (this.__subscribers != null) {
            this.__subscribers.unInstall(TopicManager.ready());
            this.__subscribers = null;
        }
    }

    onTouchUp(mx, my) { }
    onTouchDown(mx, my) { }
    onTouchMove(mx, my) { }
    onTouchHover(mx, my) { }

    registerSubscribers() {
        return null;
    }
}