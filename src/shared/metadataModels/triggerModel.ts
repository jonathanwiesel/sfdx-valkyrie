import { MetadataModel } from './base';
import { MetadataModelBuilder } from './builder';

export class TriggerModel extends MetadataModel {

    public static metadataObj = 'ApexTrigger'; 
    public static functionalName = 'triggers';

    public static async createModelsFromDescribe(objDescribes: Array<any>, builder: MetadataModelBuilder): Promise<Array<TriggerModel>> {

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