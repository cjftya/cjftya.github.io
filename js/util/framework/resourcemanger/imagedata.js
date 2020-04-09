class ImageData extends MediaData {
    constructor(path) {
        super(ResourceType.Image, path);

        this.__data = loadImage(path);
    }
}