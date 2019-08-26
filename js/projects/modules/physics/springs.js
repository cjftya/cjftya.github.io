class Springs {
    constructor() {
    }

    static followEasing(obj, to, damping) {
        //damping 0 ~ 1
        var dx = (to.x - obj.pos.x) * damping;
        var dy = (to.y - obj.pos.y) * damping;
        obj.pos.x += dx;
        obj.pos.y += dy;
    }

    static followEasingVel(obj, to, damping) {
        //damping 0 ~ 1
        var dx = (to.x - obj.pos.x) * damping;
        var dy = (to.y - obj.pos.y) * damping;
        obj.vel.x = dx;
        obj.vel.y = dy;
    }

    static followEasingAccel(obj, to, damping) {
        //damping 0 ~ 1
        var dx = (to.x - obj.pos.x) * damping;
        var dy = (to.y - obj.pos.y) * damping;
        obj.vel.x += dx;
        obj.vel.y += dy;
    }
}