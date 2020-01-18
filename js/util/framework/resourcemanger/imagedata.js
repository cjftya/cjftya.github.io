class ImageData extends MediaData {
    constructor(path) {
        super(0, path);

        this.__image = loadImage(path);
    }

    getData() {
        return this.__image;
    }
}