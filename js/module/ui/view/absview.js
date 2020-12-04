class AbsView {
    constructor(type) {
        this.__type = type;
    }

    reload() {}

    getType() {
        return this.__type;
    }

    draw() {}
}