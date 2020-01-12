class ImageView extends AbsView {
    constructor() {
        super(0);

        this.__image = null;
        this.__mask = null;
        this.__src = null;
        this.__maskSrc = null;
        this.__w = 0;
        this.__h = 0;
        this.__listener = null;

       // imageMode(CENTER);

        //width resize =  (height resize * original width size) / original height size
        //height resize = (width resize * original height size) / original width size
    }

    setListener(listener) {
        this.__listener = listener;
        // .setListener(() => {
        //     TopicManager.ready().publish(TOPICS.SCENE_LOADER, SCENES.MAIN);
        // });
        return this;
    }

    setWidth(w) {
        this.__h = (w * this.__h) / this.__w;
        this.__w = w;
        return this;
    }

    setHeight(h) {
        this.__w = (h * this.__w) / this.__h;
        this.__h = h;
        return this;
    }

    setImageSrc(src) {
        this.__src = src;
        this.__image = loadImage(src);
        var img = new Image();
        img.src = src;
        this.__w = img.naturalWidth;
        img.onload = function () {
            alert(this.width + 'x' + this.height);
        }
       // this.__h = img;
        console.log(this.__w);
        return this;
    }

    setMaskSrc(maskSrc) {
        this.__maskSrc = maskSrc;
        this.__mask = loadImage(maskSrc);
        this.__image.mask(this.__mask);
        return this;
    }

    update(delta) {
    }

    draw() {
        image(this.__image, 0+70, 0+50, 140, 100);
    }
}