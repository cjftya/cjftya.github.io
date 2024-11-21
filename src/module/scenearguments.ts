import { Arguments } from "./arguments";

export class SceneArguments {

    private ads: string;
    private args: Arguments;

    constructor(ads: string, args: Arguments) {
        this.ads = ads;
        this.args = args;
    }

    public getAddress(): string {
        return this.ads;
    }
    
    public getArguments(): Arguments {
        return this.args;
    }

    public static make(ads: string): SceneArguments {
        return new SceneArguments(ads, new Arguments());
    }

    public static makeWithArgs(ads: string, args: Arguments): SceneArguments {
        return new SceneArguments(ads, args);
    }
}