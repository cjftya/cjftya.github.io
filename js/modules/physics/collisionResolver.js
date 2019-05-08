class ContactResolver {
    constructor(){
    }

    static preUpdate(s1, s2, point, depth, normal, delta) {
        var fdepth = depth * 1.0;
        var nx = normal.x * fdepth;
        var ny = normal.y * fdepth;

        s1.pos.x += nx;
        s1.pos.y += ny;
        s2.pos.x -= nx;
        s2.pos.y -= ny;
    }

    static update(delta) {
    }
}