class FontData extends MediaData {
    constructor(path) {
        super(ResourceType.Font, path);

        if (path != null) {
            this.__data = loadFont(path);
        }
    }
}