class TitleScene extends AbsScene {
    constructor(context) {
        super(context);

        this.__click = false;

        this.__size = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);

        this.__adapter = new ListAdapter();
        this.__adapter.setData(dataSet);
        this.__listView = new ListView(context, dataSet.length);
        this.__listView.setAdapter(this.__adapter);
        this.addChild(this.__listView);
    }

    getName() {
        return "TitleScene";
    }

    onUpdateWithDraw(delta) {
        this.__listView.onUpdateWithDraw(delta);
    }

    onTouchDown(event) {
        this.__click = true;
        this.__listView.onTouchDown(event);
    }

    onTouchUp(event) {
        this.__click = false;
        this.__listView.onTouchUp(event);
    }

    onTouchMove(event) {
        this.__listView.onTouchMove(event);
    }
}