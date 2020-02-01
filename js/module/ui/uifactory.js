class UiFactory {
    constructor() { }

    static createTextView() {
        return new TextView();
    }

    static createImageView() {
        return new ImageView();
    }

    static createImageViewer() {
        return new ImageViewer();
    }
}