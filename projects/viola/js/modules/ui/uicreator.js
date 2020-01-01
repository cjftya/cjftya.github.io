class UiCreator {
    constructor() { }

    static newButton(px, py, w, h) {
        return new UiButton(px, py, w, h);
    }
}