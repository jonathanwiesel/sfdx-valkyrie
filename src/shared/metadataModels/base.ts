export abstract class MetadataModel {

    public metadataName: string;

    constructor(public sobjName: any, protected objMetadata: any) {
        this.metadataName = objMetadata.fullName;
    }

    public abstract filterObject(): boolean;

    public abstract doesHaveBypasser(bypasserName: string): boolean;
}