class Connect {
    constructor(aid, bid, l, cf, df) {
        this.__aId = aid;
        this.__bId = bid;
        this.__length = l;
        this.__constraintForce = cf;
        this.__dampForce = df;
        this.__ignoreCompressForce = false;
        this.__color = null;
    }
    getColor() {
        return this.__color;
    }
    setColor(color) {
        this.__color = color;
    }
    isIgnoreCompress() {
        return this.__ignoreCompressForce;
    }
    setIgnoreCompressForce(enable) {
        this.__ignoreCompressForce = enable;
    }

    getConstraintForce() {
        return this.__constraintForce;
    }
    getDampForce() {
        return this.__dampForce;
    }
    getLength() {
        return this.__length;
    }
    getIdA() {
        return this.__aId;
    }
    getIdB() {
        return this.__bId;
    }
}