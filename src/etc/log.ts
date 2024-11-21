import { L } from "./linker";

export class Log {

    private static debug: boolean = L.values.debug;

    public static e(tag: string, msg: string): void  {
        console.log("[E:"+tag+"] " + msg);
    }

    public static d(tag: string, msg: string): void  {
        if (this.debug) {
            console.log("[D:"+tag+"] " + msg);
        }
    }

    public static i(tag: string, msg: string): void  {
        console.log("[I:"+tag+"] " + msg);
    }
}