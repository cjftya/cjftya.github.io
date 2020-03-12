class AbsView {
    constructor(type) {
        this.__type = type;
    }

    getType() {
        return this.__type;
    }

    draw() {}
}