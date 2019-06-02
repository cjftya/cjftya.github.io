class Springs {
    constructor() {
    }

    static followEasing(from, to, damping) {
        //damping 0 ~ 1
        var dx = (to.x - from.x) * damping;
        var dy = (to.y - from.y) * damping;
        from.x += dx;
        from.y += dy;
    }
}