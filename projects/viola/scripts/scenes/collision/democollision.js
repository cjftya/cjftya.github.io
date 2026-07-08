class DemoCollsion {
    constructor() { }

    static Demo1(shapePool) {
        for (var i = 0; i < 2; i++) {
            shapePool.insert(ShapeFactory.createRect(30 * (i+1) + 170, windowHeight - 185,
            30, 30, ShapeMode.Dynamic));
        }
        for (var i = 0; i < 4; i++) {
            shapePool.insert(ShapeFactory.createRect(30 * (i+1) + 140, windowHeight - 155,
            30, 30, ShapeMode.Dynamic));
        }
        for (var i = 0; i < 6; i++) {
            shapePool.insert(ShapeFactory.createRect(30 * (i+1) + 110, windowHeight - 12,
            30, 30, ShapeMode.Dynamic));
        }
        for (var i = 0; i < 8; i++) {
            shapePool.insert(ShapeFactory.createRect(30 * (i+1) + 80, windowHeight - 90,
            30, 30, ShapeMode.Dynamic));
        }
        for (var i = 0; i < 10; i++) {
            shapePool.insert(ShapeFactory.createRect(30 * (i+1) + 50, windowHeight - 60,
            30, 30, ShapeMode.Dynamic));
        }
        this.__guideLine(shapePool);
    }

    static Demo2(shapePool) {
        for (var i = 0; i < 20; i++) {
            shapePool.insert(ShapeFactory.createPentagon(MathUtil.randInt(50, windowHeight - 50), MathUtil.randInt(50, windowHeight - 500),
                MathUtil.randInt(20, 30), ShapeMode.Dynamic));
        }
        for (var i = 0; i < 20; i++) {
            shapePool.insert(ShapeFactory.createRect(MathUtil.randInt(50, windowHeight - 50), MathUtil.randInt(50, windowHeight - 300),
                MathUtil.randInt(20, 40), MathUtil.randInt(20, 40), ShapeMode.Dynamic));
        }
        for (var i = 0; i < 20; i++) {
            shapePool.insert(ShapeFactory.createTriangle(MathUtil.randInt(50, windowHeight - 50), MathUtil.randInt(50, windowHeight - 100),
                MathUtil.randInt(25, 40), ShapeMode.Dynamic));
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