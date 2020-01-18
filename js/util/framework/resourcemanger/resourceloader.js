class ResourceLoader {
    constructor() {
        this.__listener = null;
        this.__dataMap = new Map();
        this.__typeMap = new Map();
        this.__loadedCount = 0;
    }

    setListener(listener) {
        this.__listener = listener;
        return this;
    }

    add(path, type) {
        this.__typeMap.set(path, type);
        return this;
    }

    get(path) {
        return this.__dataMap.get(path);
    }

    load() {
        for (var [path, type] of this.__typeMap.entries()) {
            if(type == ResourceType.Image) {
                this.__dataMap.set(path, new ImageData(path));
            }
            this.__listener(this.__typeMap.size, this.__dataMap.size);
        }
        return this;
    }
}