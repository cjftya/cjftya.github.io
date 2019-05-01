class AbsSystem {
    constructor() {
        this.subscribers = null;
    }

    onCreate() {
        this.subscribers = this.registerSubscribers();
        this.subscribers.install(TopicManager.ready());
    }
    onPause() { }
    onOperate() { }
    onDestroy() { 
        this.subscribers.unInstall(TopicManager.ready());
        this.subscribers = null;
    }

    onTouchUp(mx, my) { }
    onTouchDown(mx, my) { }
    onTouchMove(mx, my) { }

    registerSubscribers() { 
        return null;
    }
}