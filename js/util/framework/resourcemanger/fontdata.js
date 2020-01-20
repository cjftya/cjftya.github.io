class FontData extends MediaData {
    constructor(path) {
        super(0, path);

        this.__font = loadFont(path);
    }

    getData() {
        return this.__font;
    }
}