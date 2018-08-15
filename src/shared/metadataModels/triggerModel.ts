import { MetadataModel } from './base';
import { MetadataModelBuilder } from './builder';

export class TriggerModel extends MetadataModel {

    public static metadataObj = 'ApexTrigger'; 
    public static functionalName = 'triggers';
    public static toolingApiConfig = {
        fields: ['Body', 'Name', 'EntityDefinition.QualifiedApiName'],
        filter: function (classNames: Array<string>) {
            return {
                'Name': classNames,
                'ManageableState': 'unmanaged',
                'Status': 'Active'
            };
        }
    };
    
    public static async createModelsFromDescribe(objDescribes: Array<any>, builder: MetadataModelBuilder, filteringObjects: Array<string> = []): Promise<Array<TriggerModel>> {

        let models = [];

        const normalizedSobjs = filteringObjects.map(item => item.toLowerCase());

        for (let objDescribe of objDescribes) {
            models.push(new TriggerModel(objDescribe.EntityDefinition.QualifiedApiName, objDescribe, normalizedSobjs));
        }

        return models;
    }

    constructor(sobjName: any, objMetadata: any, private filteringObjects: Array<string>) {
        super(sobjName, objMetadata, objMetadata.Name);
    }

    public filterObject(): boolean {
        return !this.filteringObjects.length || this.filteringObjects.includes(this.objMetadata.EntityDefinition.QualifiedApiName.toLowerCase());
    }

    public doesHaveBypasser(bypasserName: string): boolean {
        return this.objMetadata.Body.toLowerCase().indexOf(bypasserName) >= 0;
    }
}