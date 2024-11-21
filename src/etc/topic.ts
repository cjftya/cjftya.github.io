export class TopicKey {

    private static Event: string = "#event";
    public static LoadScene: string = this.Event + "/load-scene";
    public static WindowSizeChanged: string = this.Event + "/win-size-changed";

    private static Data: string = "#data";
    public static PixiContext: string = this.Data + "/pixi-context";
}