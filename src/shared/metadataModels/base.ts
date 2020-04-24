export abstract class MetadataModel {

    public static metadataObj: string; 
    public static functionalName: string;
    public static useToolingApi: boolean;

    constructor(public sobjName: any, protected objMetadata: any, public metadataName: string) {}

    public filterObject(): boolean {
        return true;
    };

    public doesHaveBypasser(bypasserName: string): boolean {
        return true;
    };
}