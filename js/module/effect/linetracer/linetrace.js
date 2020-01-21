class LineTrace {
    constructor() {
        this.__points = [];
        this.__indexCount = 0;

        this.__pos = new Vector2d();
        this.__vel = new Vector2d();
        this.__posOffset = new Vector2d();

        this.__visibleLine = true;
        this.__start = false;
        this.__energy = 1;
    }

    addPoint(x, y) {
        this.__points.push(new Vector2d().set(x, y));
        return this;
    }

    addPos(x, y) {
        this.__posOffset.x += x;
        this.__posOffset.y += y;
    }

    setVisibleLine(v) {
        this.__visibleLine = v;
    }

    start() {
        this.setupVelocity(0);
        this.__pos.set(this.__points[0].x, this.__points[0].y);
        this.__start = true;
    }

    setupVelocity(index) {
        var dx = this.__points[index].x - this.__pos.x;
        var dy = this.__points[index].y - this.__pos.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        this.__vel.x = this.__energy * (dx / d);
        this.__vel.y = this.__energy * (dy / d);
    }

    getTracePos() {
        return this.__pos;
    }

    update(delta) {
        if (!this.__start) {
            return;
        }

        var dx = this.__points[this.__indexCount].x - this.__pos.x;
        var dy = this.__points[this.__indexCount].y - this.__pos.y;
        var d = dx * dx + dy * dy;
        if (d < 100) {
            this.__indexCount++;
            if (this.__indexCount >= this.__points.length) {
                this.__indexCount = 0;
            }
            this.setupVelocity(this.__indexCount);
        }

        this.__pos.x += this.__vel.x;
        this.__pos.y += this.__vel.y;
    }

    draw() {
        if (this.__visibleLine) {
            fill(200, 100, 100);
            ellipse(this.__pos.x, this.__pos.y + this.__posOffset.y, 10, 10);
            for (var p of this.__points) {
                fill(100, 100, 200);
                ellipse(p.x, p.y + this.__posOffset.y, 10, 10);
            }
        }
    }
}