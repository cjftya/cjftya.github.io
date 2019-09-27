class DemoCollsion {
    constructor() { }

    static Demo1(shapePool) {
    }

    static Demo2(shapePool) {
        for (var i = 0; i < 100; i++) {
            shapePool.insert(ShapeFactory.createRect(MathUtil.randInt(50, windowHeight - 50), MathUtil.randInt(50, windowHeight - 100),
                MathUtil.randInt(20, 30), MathUtil.randInt(20, 30), ShapeMode.Dynamic));
        }
        this.__guideLine(shapePool);
    }

    static Demo3(shapePool) {
    }

    static __guideLine(shapePool) {
        // ground
        shapePool.insert(ShapeFactory.createRect(0, windowHeight - 30,
            windowWidth, 30, ShapeMode.Static));

        // left
        shapePool.insert(ShapeFactory.createRect(0, 0,
            30, windowHeight, ShapeMode.Static));

        // right
        shapePool.insert(ShapeFactory.createRect(windowWidth - 30, 0,
            30, windowHeight, ShapeMode.Static));
    }
}