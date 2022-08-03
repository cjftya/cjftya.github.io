export class AddressBuilder {

    private address: string;

    constructor(address: string) {
        this.address = address + '@';
    }

    public appendArg(key: string, value: any): AddressBuilder {
        this.address += '/' + key + '?' + value;
        return this;
    }

    public build(): string {
        return this.address;
    }
}

export class AddressUtil {

    public static getAddress(key: string): string {
        const v = key.split('@');
        return v.length > 1 ? v[0] : key;
    }

    public static getArg(key: string, argKey: string): any;
    public static getArg(key: string, argKey: string, def?: any): any {
        const args = this.getArgs(key);
        for (let t in args) {
            let v = t.split('?');
            if (v[0] == argKey) {
                return v[1];
            }
        }
        return def;
    }

    private static getArgs(key: string): string[] {
        const objs = key.split('@');
        if (objs.length > 2) {
            return objs[0].split('/');
        }
        return [];
    }
}