class PContact {
    constructor(n, d, aid, bid) {
        this.__e = 0;
        this.__n = n;
        this.__d = d;
        this.__aId = aid;
        this.__bId = bid;
    }

    getNormal() {
        return this.__n;
    }
    getDepth() {
        return this.__d;
    }
    getIdA() {
        return this.__aId;
    }
    getIdB() {
        return this.__bId;
    }
}