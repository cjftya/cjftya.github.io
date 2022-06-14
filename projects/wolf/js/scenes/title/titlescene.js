class TitleScene extends AbsScene {
    constructor(context) {
        super(context);

        this.__click = false;

        this.__size = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);

        this.bindBackground();

        this.__adapter = new ListAdapter();
        this.__adapter.setData(dataSet);
        this.__listView = new ListView(context);
        this.__listView.setAdapter(this.__adapter);
        this.addChild(this.__listView);

        this.__pointEffect = new PointerEffect(context);
        this.addChild(this.__pointEffect);
    }

    getName() {
        return "TitleScene";
    }

    onUpdateWithDraw(delta) {
        this.__listView.onUpdateWithDraw(delta);
        this.__pointEffect.onUpdateWithDraw(delta);
    }

    onTouchDown(event) {
        this.__click = true;
        this.__listView.onTouchDown(event);
        this.__pointEffect.onTouchDown(event);
    }

    onTouchUp(event) {
        this.__click = false;
        this.__listView.onTouchUp(event);
        this.__pointEffect.onTouchUp(event);
    }

    onTouchMove(event) {
        this.__listView.onTouchMove(event);
    }

    bindBackground() {
        const gradTexture = this.createGradTexture();
        const sprite = new PIXI.Sprite(gradTexture);
        sprite.position.set(0, 0);
        sprite.alpha = 1;
        sprite.width = this.__size.width;
        sprite.height = this.__size.height;
        this.addChild(sprite);

        const graphics = new PIXI.Graphics();

        graphics.beginFill(0x000000, 1);
        graphics.drawEllipse(this.__size.width / 2, this.__size.height, this.__size.width / 1.8, this.__size.width / 6);
        graphics.endFill();

        for (var i = 0; i < 90; i++) {
            graphics.beginFill(0xfcfcfc, 0.8);
            graphics.drawCircle(MathUtil.randInt(0, this.__size.width), MathUtil.randInt(50, this.__size.height / 1.3),
                MathUtil.randInt(2, 3) / 3);
            graphics.endFill();
        }

        this.addChild(graphics);
    }

    createGradTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = this.__size.width;
        canvas.height = this.__size.height;

        const ctx = canvas.getContext('2d');

        var grd = ctx.createRadialGradient(this.__size.width / 2, this.__size.height, 0, this.__size.width / 2, this.__size.height, this.__size.width / 1.2);
        grd.addColorStop(0, 'hsla(349, 94%, 75%, 1)');
        grd.addColorStop(0.12, 'hsla(342, 49%, 62%, 1)');
        grd.addColorStop(0.18, 'hsla(328, 37%, 56%, 1)');
        grd.addColorStop(0.33, 'hsla(281, 33%, 48%, 1)');
        grd.addColorStop(0.41, 'hsla(268, 38%, 48%, 1)');
        grd.addColorStop(0.45, 'hsla(266, 38%, 43%, 1)');
        grd.addColorStop(0.55, 'hsla(261, 37%, 32%, 1)');
        grd.addColorStop(0.64, 'hsla(253, 36%, 24%, 1)');
        grd.addColorStop(0.72, 'hsla(244, 33%, 19%, 1)');
        grd.addColorStop(0.78, 'hsla(240, 33%, 17%, 1)');
        ctx.fillStyle = grd;
        ctx.arc(this.__size.width / 2, this.__size.height, this.__size.width / 1.2, 0, (Math.PI / 180) * 360, true);
        ctx.fill();

        return PIXI.Texture.from(canvas);
    }
}