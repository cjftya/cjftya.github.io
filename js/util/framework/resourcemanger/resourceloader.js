class ResourceLoader {
    constructor() {
        this.__listener = null;
        this.__completedListener = null;
        this.__dataMap = new Map();
        this.__typeMap = new Map();
        this.__loadedCount = 0;
        this.__totalLoadTime = 0;
    }

    setListener(listener) {
        this.__listener = listener;
        return this;
    }

    setCompletedListener(listener) {
        this.__completedListener = listener;
        return this;
    }

    add(path, type) {
        this.__typeMap.set(path, type);
        return this;
    }

    get(path) {
        return this.__dataMap.get(path);
    }

    getData(type, path) {
        switch (type) {
            case ResourceType.Image:
                return new ImageData(path);
            case ResourceType.Font:
                return new FontData(path);
            case ResourceType.Video:
                return new VideoData(path);
            case ResourceType.Sound:
                return new SoundData(path);
        }
        return null;
    }

    load() {
        var t0 = performance.now();
        for (var [path, type] of this.__typeMap.entries()) {
            this.__dataMap.set(path, this.getData(type, path));
            this.__listener(this.__dataMap.size, path);
        }
        var t1 = performance.now();
        this.__totalLoadTime = (t1 - t0) / 1000;
        this.__completedListener(this.__typeMap.size, this.__totalLoadTime);
        return this;
    }
}