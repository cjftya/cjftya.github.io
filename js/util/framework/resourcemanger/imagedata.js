class ImageData extends MediaData {
    constructor(path) {
        super(ResourceType.Image, path);

        if (path != null) {
            this.__data = loadImage(path);
        }
    }
}