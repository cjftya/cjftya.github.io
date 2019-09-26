class DemoCollsion {
    constructor() { }

    static Demo1(shapePool) {
        // Pool circle
        // for (var i = 0; i < 100; i++) {
        //     shapePool.insert(ShapeFactory.createCircle(MathUtil.randInt(50, 600), MathUtil.randInt(50, 600), MathUtil.randInt(10, 20), ShapeMode.Dynamic));
        // }
        // this.__guideLine(shapePool);
    }

    static Demo2(shapePool) {
        // Pool poly
        for (var i = 0; i < 2; i++) {
            shapePool.insert(ShapeFactory.createRect(MathUtil.randInt(50, 600), MathUtil.randInt(50, 600),
                MathUtil.randInt(30, 80), MathUtil.randInt(20, 50), ShapeMode.Dynamic));
        }
      //  this.__guideLine(shapePool);
    }

    static Demo3(shapePool) {
        // Pool poly & circle
        // for (var i = 0; i < 10; i++) {
        //     shapePool.insert(ShapeFactory.createCircle(MathUtil.randInt(50, 600), MathUtil.randInt(50, 600), MathUtil.randInt(10, 20), ShapeMode.Dynamic));
        // }
        // for (var i = 0; i < 8; i++) {
        //     shapePool.insert(ShapeFactory.createRect(MathUtil.randInt(50, 600), MathUtil.randInt(50, 600),
        //         MathUtil.randInt(30, 80), MathUtil.randInt(20, 50), MathUtil.randInt(0, 45), ShapeMode.Dynamic));
        // }
        // this.__guideLine(shapePool);
        // // test
        // shapePool.insert(ShapeFactory.createRect(150, windowHeight / 2,
        //     windowWidth / 3, 50, 35, ShapeMode.Static));
    }

    static __guideLine(shapePool) {
        // ground
        shapePool.insert(ShapeFactory.createRect(windowWidth / 2, windowHeight,
            windowWidth, 30, ShapeMode.Static));

        // left
        shapePool.insert(ShapeFactory.createRect(0, windowHeight / 2,
            30, windowHeight, ShapeMode.Static));

        // right
        shapePool.insert(ShapeFactory.createRect(windowWidth, windowHeight / 2,
            30, windowHeight, ShapeMode.Static));
    }
}