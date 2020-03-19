class UiFactory {
    constructor() { }

    static createTextView() {
        return new TextView();
    }

    static createImageView() {
        return new ImageView();
    }
}