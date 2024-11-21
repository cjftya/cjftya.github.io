export class Arguments {

    private map = new Map<string, any>();

    public addData(key: string, data: any): void {
        if (data instanceof Function) {
            throw new Error("data type is Function");
        }
        this.map.set(key, data);
    }

    public getData(key: string): any {
        return this.getDataDef(key, "no default");
    }

    public getDataDef(key: string, def: any): any {
        if (this.map.has(key)) {
            return this.map.get(key);
        }
        return def;
    }
}