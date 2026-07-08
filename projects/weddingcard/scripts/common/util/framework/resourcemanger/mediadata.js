class MediaData {
    constructor(type, path) {
        this.__data = null;
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
        return this.__data;
    }

    setData(type, path, data) {
        this.__type = type;
        this.__absPath = path;
        this.__data = data;
        return this;
    }
}