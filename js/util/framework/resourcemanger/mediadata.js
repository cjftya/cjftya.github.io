class MediaData {
    constructor(type, path) {
        this.__type = type;
        this.__absPath = path;
    }

    getType() {
        return this.__type;
    }

    getPath() {
        return this.__absPath;
    }

    getData() {
        return null;
    }
}