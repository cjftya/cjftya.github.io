class ViewGroup extends View {
    constructor(context) {
        super(context);
        this.__groups = [];
        this.__container = new PIXI.Container();
        context.stage.addChild(this.__container);
    }

    getPixiView() {
        return this.__container;
    }

    onCreate() {
        for (let child of this.__groups) {
            child.onCreate();
        }
    }

    getChildCount() {
        return this.__container.children.length;
    }

    addChild(v) {
        if (v instanceof View) {
            this.__groups.push(v);
            this.__container.addChild(v.getPixiView());
        }
    }

    onDetach() {
        this.getContext().removeChild(this.__container);
    }

    onDestroy() {
        for (let child of this.__groups) {
            child.onDestroy();
        }
    }
}