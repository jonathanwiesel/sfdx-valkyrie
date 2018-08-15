import { MetadataModel } from './base';
import { MetadataModelBuilder } from './builder';

export class ApexClassModel extends MetadataModel {

    public static metadataObj = 'ApexClass'; 
    public static functionalName = 'apex classes';
    public static toolingApiConfig = {
        fields: ['Body', 'Name'],
        filter: function (classNames: Array<string>) {
            return {
                'Name': classNames,
                'ManageableState': 'unmanaged'
            };
        }
    };

    public static async createModelsFromDescribe(objDescribes: Array<any>, builder: MetadataModelBuilder): Promise<Array<ApexClassModel>> {

        let models = [];

        for (let objDescribe of objDescribes) {
            models.push(new ApexClassModel(null, objDescribe, objDescribe.Name));
        }

        return models;
    }

    public filterObject(): boolean {
        return true;
    }

    public doesHaveBypasser(bypasserName: string): boolean {
        return this.objMetadata.Body.toLowerCase().indexOf(bypasserName) >= 0;
    }
}