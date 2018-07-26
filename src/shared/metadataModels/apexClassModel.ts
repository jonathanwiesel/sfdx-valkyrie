import { MetadataModel } from './base';
import { MetadataModelBuilder } from './builder';

export class ApexClassModel extends MetadataModel {

    public static metadataObj = 'ApexClass'; 
    public static functionalName = 'apex classes';

    public static async createModelsFromDescribe(objDescribes: Array<any>, builder: MetadataModelBuilder): Promise<Array<ApexClassModel>> {

        let models = [];

        console.log(objDescribes);

        return models;
    }

    public filterObject(): boolean {
        return false;
    }

    public doesHaveBypasser(bypasserName: string): boolean {
        return false;
    }
}