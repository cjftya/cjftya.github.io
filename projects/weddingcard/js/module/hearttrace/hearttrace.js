class HeartTrace {
    constructor() {
        this.__ws = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__points = [];

        this.__center = new Vector2d();
        this.__posOffset = new Vector2d();
        this.__particles = [];


        this.__sw = 0;
        this.__sh = 0;

        this.__debug = false;

        this.__pointIndex = [];
        this.__headPoints = [];
        this.__headVels = [];

        for (var i = 0; i < 38; i++) {
            this.__points.push(new Vector2d());
        }
    }

    setup(cx, cy) {
        var wDivid = this.__sw / 15;
        var hDivid = this.__sh / 15;
        var winWidth = this.__ws[0];
        var winHeigth = this.__ws[1];

        this.__points[0].x = winWidth / 2 + 5;
        this.__points[0].y = cy - (this.__sh / 4);
        this.__points[1].x = winWidth / 2 + wDivid;
        this.__points[1].y = cy - (this.__sh / 4) - hDivid - 5;
        this.__points[2].x = winWidth / 2 + (wDivid * 2);
        this.__points[2].y = cy - (this.__sh / 4) - (hDivid * 2);
        this.__points[3].x = winWidth / 2 + (wDivid * 3);
        this.__points[3].y = cy - (this.__sh / 4) - (hDivid * 2.3);
        this.__points[4].x = winWidth / 2 + (wDivid * 4);
        this.__points[4].y = cy - (this.__sh / 4) - (hDivid * 2.1) - 2;
        this.__points[5].x = winWidth / 2 + (wDivid * 5);
        this.__points[5].y = cy - (this.__sh / 4) - (hDivid * 1.7);
        this.__points[6].x = winWidth / 2 + (wDivid * 6) - 4;
        this.__points[6].y = cy - (this.__sh / 4) - (hDivid * 1.0);
        this.__points[7].x = winWidth / 2 + (wDivid * 6.5) - 2;
        this.__points[7].y = cy - (this.__sh / 4);
        this.__points[8].x = winWidth / 2 + (wDivid * 6.6);
        this.__points[8].y = cy - (this.__sh / 4) + hDivid;
        this.__points[9].x = winWidth / 2 + (wDivid * 6.6);
        this.__points[9].y = cy - (this.__sh / 4) + (hDivid * 2);
        this.__points[10].x = winWidth / 2 + (wDivid * 6.4);
        this.__points[10].y = cy - (this.__sh / 4) + (hDivid * 3);
        this.__points[11].x = winWidth / 2 + (wDivid * 6.15);
        this.__points[11].y = cy - (this.__sh / 4) + (hDivid * 4);
        this.__points[12].x = winWidth / 2 + (wDivid * 5.5);
        this.__points[12].y = cy - (this.__sh / 4) + (hDivid * 5);
        this.__points[13].x = winWidth / 2 + (wDivid * 4.7);
        this.__points[13].y = cy - (this.__sh / 4) + (hDivid * 6) - 2;
        this.__points[14].x = winWidth / 2 + (wDivid * 3.8);
        this.__points[14].y = cy - (this.__sh / 4) + (hDivid * 6.7);
        this.__points[15].x = winWidth / 2 + (wDivid * 2.8);
        this.__points[15].y = cy - (this.__sh / 4) + (hDivid * 7.4);
        this.__points[16].x = winWidth / 2 + (wDivid * 1.8);
        this.__points[16].y = cy - (this.__sh / 4) + (hDivid * 8.1);
        this.__points[17].x = winWidth / 2 + (wDivid * 0.8);
        this.__points[17].y = cy - (this.__sh / 4) + (hDivid * 8.9);
        this.__points[18].x = winWidth / 2 - (wDivid * 0.2);
        this.__points[18].y = cy - (this.__sh / 4) + (hDivid * 9.7);
        this.__points[19].x = winWidth / 2 - (wDivid * 0.9);
        this.__points[19].y = cy - (this.__sh / 4) + (hDivid * 10.5);
        this.__points[20].x = winWidth / 2 - (wDivid * 1.3);
        this.__points[20].y = cy - (this.__sh / 4) + (hDivid * 9.6);
        this.__points[21].x = winWidth / 2 - (wDivid * 2.1);
        this.__points[21].y = cy - (this.__sh / 4) + (hDivid * 8.6);
        this.__points[22].x = winWidth / 2 - (wDivid * 3.1);
        this.__points[22].y = cy - (this.__sh / 4) + (hDivid * 7.6);
        this.__points[23].x = winWidth / 2 - (wDivid * 4.0);
        this.__points[23].y = cy - (this.__sh / 4) + (hDivid * 6.6);
        this.__points[24].x = winWidth / 2 - (wDivid * 4.9);
        this.__points[24].y = cy - (this.__sh / 4) + (hDivid * 5.6);
        this.__points[25].x = winWidth / 2 - (wDivid * 5.6);
        this.__points[25].y = cy - (this.__sh / 4) + (hDivid * 4.7);
        this.__points[26].x = winWidth / 2 - (wDivid * 6.1);
        this.__points[26].y = cy - (this.__sh / 4) + (hDivid * 3.8);
        this.__points[27].x = winWidth / 2 - (wDivid * 6.4);
        this.__points[27].y = cy - (this.__sh / 4) + (hDivid * 2.8);
        this.__points[28].x = winWidth / 2 - (wDivid * 6.5);
        this.__points[28].y = cy - (this.__sh / 4) + (hDivid * 1.9);
        this.__points[29].x = winWidth / 2 - (wDivid * 6.5);
        this.__points[29].y = cy - (this.__sh / 4) + (hDivid * 1.0);
        this.__points[30].x = winWidth / 2 - (wDivid * 6.35);
        this.__points[30].y = cy - (this.__sh / 4) + (hDivid * 0.07);
        this.__points[31].x = winWidth / 2 - (wDivid * 6.0);
        this.__points[31].y = cy - (this.__sh / 4) - (hDivid * 1.0);
        this.__points[32].x = winWidth / 2 - (wDivid * 5.3);
        this.__points[32].y = cy - (this.__sh / 4) - (hDivid * 1.9);
        this.__points[33].x = winWidth / 2 - (wDivid * 4.3);
        this.__points[33].y = cy - (this.__sh / 4) - (hDivid * 2.6);
        this.__points[34].x = winWidth / 2 - (wDivid * 3.0);
        this.__points[34].y = cy - (this.__sh / 4) - (hDivid * 2.9);
        this.__points[35].x = winWidth / 2 - (wDivid * 2.0);
        this.__points[35].y = cy - (this.__sh / 4) - (hDivid * 2.8);
        this.__points[36].x = winWidth / 2 - (wDivid * 1.0);
        this.__points[36].y = cy - (this.__sh / 4) - (hDivid * 2.2);
        this.__points[37].x = winWidth / 2 - (wDivid * 0.2);
        this.__points[37].y = cy - (this.__sh / 4) - (hDivid * 1.1);
    }

    setMovePointCount(c) {
        var p1, p2, p3;
        var divCount;

        for (var i = 0; i < c; i++) {
            this.__headPoints.push(new Vector2d());
            this.__headVels.push(new Vector2d());
        }

        for (var i = 0; i < c; i++) {
            var pt = EffectFactory.createParticle(Particle.Spray)
                .setRadius(2, 8)
                .setBlurRadiusPow(4, 8)
                .setAmount(60)
                .setPos(1000, 1000)
                .setCreateArea(3, 3)
                .setLife(200)
                .setFreq(0.03);
            this.__particles.push(pt);
        }

        if (c == 1) {
            p1 = MathUtil.randInt(0, this.__points.length - 1);
            this.__pointIndex.push(p1);
            this.__headPoints[0].x = this.__points[p1].x;
            this.__headPoints[0].y = this.__points[p1].y;
        } else if (c == 2) {
            divCount = this.__points.length / 2;
            p1 = MathUtil.randInt(0, this.__points.length - 1);
            if (p1 + divCount > this.__points.length - 1) {
                p2 = (p1 + divCount) - this.__points.length - 1;
            } else {
                p2 = p1 + divCount;
            }
            this.__pointIndex.push(p1);
            this.__pointIndex.push(p2);
            this.__headPoints[0].x = this.__points[p1].x;
            this.__headPoints[0].y = this.__points[p1].y;
            this.__headPoints[1].x = this.__points[p2].x;
            this.__headPoints[1].y = this.__points[p2].y;
        } else if (c == 3) {
            divCount = 12;
            p1 = MathUtil.randInt(0, this.__points.length - 1);
            if (p1 + divCount > this.__points.length - 1) {
                p2 = (p1 + divCount) - this.__points.length - 1;
            } else {
                p2 = p1 + divCount;
            }
            if (p2 + divCount > this.__points.length - 1) {
                p3 = (p2 + divCount) - this.__points.length - 1;
            } else {
                p3 = p2 + divCount;
            }
            this.__pointIndex.push(p1);
            this.__pointIndex.push(p2);
            this.__pointIndex.push(p3);
            this.__headPoints[0].x = this.__points[p1].x;
            this.__headPoints[0].y = this.__points[p1].y;
            this.__headPoints[1].x = this.__points[p2].x;
            this.__headPoints[1].y = this.__points[p2].y;
            this.__headPoints[2].x = this.__points[p3].x;
            this.__headPoints[2].y = this.__points[p3].y;
        }
        return this;
    }

    setHeartSize(sw, sh) {
        this.__sw = sw;
        this.__sh = sh;
        return this;
    }

    addPos(ax, ay) {
        this.__posOffset.x += ax;
        this.__posOffset.y += ay;
        this.__center.x += this.__posOffset.x;
        this.__center.y += this.__posOffset.y;
        return this;
    }

    setPos(cx, cy) {
        this.__center.set(cx, cy);
        this.setup(cx, cy);
        return this;
    }

    getPos() {
        return this.__center;
    }

    getHeadPos(index) {
        return this.__headPoints[index];
    }

    getParticles() {
        return this.__particles;
    }

    updateWithDraw() {
        this.update();
        this.draw();
    }

    update() {
        for (var i = 0; i < this.__headPoints.length; i++) {
            var index = this.__pointIndex[i];
            var dx = this.__points[index].x - this.__headPoints[i].x;
            var dy = this.__points[index].y - this.__headPoints[i].y;

            var d = dx * dx + dy * dy;
            if (d < 50) {
                this.__pointIndex[i]++;
                if (this.__pointIndex[i] >= this.__points.length) {
                    this.__pointIndex[i] = 0;
                }
            }
            this.__headVels[i].x += dx * 0.07;
            this.__headVels[i].y += dy * 0.07;
            this.__headVels[i].x *= 0.75;
            this.__headVels[i].y *= 0.75;
            this.__headPoints[i].x += this.__headVels[i].x;
            this.__headPoints[i].y += this.__headVels[i].y;

            //paticle
            this.__particles[i].setPos(this.__headPoints[i].x,
                this.__headPoints[i].y + this.__posOffset.y);
        }
    }

    draw() {
        if (this.__debug) {
            fill(255, 0, 0, 140);
            for (var p of this.__points) {
                ellipse(p.x, p.y + this.__posOffset.y, 5, 5);
            }
            fill(0, 0, 255, 140);
            for (var p of this.__headPoints) {
                ellipse(p.x, p.y + this.__posOffset.y, 10, 10);
            }
        }
    }
}