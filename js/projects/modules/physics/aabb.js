class AABB {
    constructor() {
        this.pos = new Vector2d();
        this.w = 0;
        this.h = 0;
    }

    update(x, y, w, h) {
        this.pos.set(x, y);
        this.w = w;
        this.h = h;
    }

    contains(x, y) {
        if (x > this.pos.x && x < this.pos.x + this.w &&
            y > this.pos.y && y < this.pos.y + this.h) {
            return true;
        }
        return false;
    }

    intersect(other) {
        if (this.pos.x + this.w < other.pos.x || this.pos.x > other.pos.x + other.w) {
            return false;
        }
        else if (this.pos.y + this.h < other.pos.y || this.pos.y > other.pos.y + other.h) {
            return false;
        }
        return true;
    }

    draw() {
        fill(120, 120, 120, 100);
        rect(this.pos.x, this.pos.y, this.w, this.h);
    }
}