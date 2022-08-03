export class DataRequest {
    private static DATABASE_REQUEST: string = "database-request/";
    private static MEDIADATA_REQUEST: string = "mediadata-request/";

    public static getDataBaseKey(key: string): string {
        return this.DATABASE_REQUEST + key;
    }

    public static getMediaDataKey(key: string): string {
        return this.MEDIADATA_REQUEST + key;
    }
}