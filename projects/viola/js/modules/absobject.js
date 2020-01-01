class AbsObject {
    constructor() {
        this.id = 0;
        this.tag = "not";
        this.originType = -1;
    }

    setId(id) {
        this.id = id;
    }

    setTag(tag) {
        this.tag = tag;
    }

    setOriginType(type) {
        this.originType = type;
    }
}