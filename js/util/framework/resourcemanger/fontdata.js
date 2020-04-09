class FontData extends MediaData {
    constructor(path) {
        super(ResourceType.Font, path);

        this.__data = loadFont(path);
    }
}