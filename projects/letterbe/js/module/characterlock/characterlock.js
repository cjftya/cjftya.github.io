class CharacterLock {
    constructor() {
        //textFont(loadFont("assets/Santalum.ttf"));

        this.__points = [];
        this.__particles = [];

        for (var i = 0; i < 9; i++) {
            this.__points.push(new CharacterPoint());
            this.setupPoint(this.__points[i]);

            this.__particles.push(new Spray());
        }

        this.setupPositionForCharPoint();
        this.setupPositionForParticle();
    }

    setupPositionForCharPoint() {
        var paddingH = windowHeight / 10;
        var h = windowHeight - (paddingH * 2);
        var oneSlice = h / 4;
        var w = windowWidth / 2;
        var startCol2 = w - (oneSlice / 2);
        var startCol3 = w - oneSlice;

        //   U
        //  E S
        // P V A
        //  I O
        //   L
        this.__points[0].setPos(w, paddingH).setChar("U");
        this.__points[1].setPos(startCol2, this.__points[0].pos.y + oneSlice).setChar("E");
        this.__points[2].setPos(startCol2 + oneSlice, this.__points[0].pos.y + oneSlice).setChar("S");
        this.__points[3].setPos(startCol3, this.__points[1].pos.y + oneSlice).setChar("P");
        this.__points[4].setPos(startCol3 + oneSlice, this.__points[1].pos.y + oneSlice).setChar("V");
        this.__points[5].setPos(startCol3 + oneSlice * 2, this.__points[1].pos.y + oneSlice).setChar("A");
        this.__points[6].setPos(startCol2, this.__points[3].pos.y + oneSlice).setChar("I");
        this.__points[7].setPos(startCol2 + oneSlice, this.__points[3].pos.y + oneSlice).setChar("O");
        this.__points[8].setPos(w, this.__points[6].pos.y + oneSlice).setChar("L");
    }

    setupPositionForParticle() {
        for (var i = 0; i < this.__points.length; i++) {
            this.__particles[i].setPos(this.__points[i].pos.x, this.__points[i].pos.y);
            this.__particles[i].setLife(100);
            this.__particles[i].setFreq(0.03);
        }
    }

    setupPoint(p) {
        p.setColor(255, 255, 255);
        p.setAlpha(250);
        p.setSize(70);
        p.setCharSize(40);
    }

    update(delta) {
        for (var p of this.__particles) {
            p.update(delta);
        }
    }

    draw() {
        for (var i = 0; i < this.__points.length; i++) {
            this.__points[i].draw();
            this.__particles[i].draw();
        }
    }
}