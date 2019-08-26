class Contact {
    constructor(p, n, d, aid, bid) {
        this.__p = p; //collision points
        this.__n = n; //collision normal
        this.__d = d; //collision depth
        this.__aId = aid;
        this.__bId = bid;

        this.__deltaVelocity = 0;
    }

    getPoint() {
        return this.__p;
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