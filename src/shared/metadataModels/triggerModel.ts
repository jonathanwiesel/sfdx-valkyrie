import { MetadataModel } from './base';

export class TriggerModel extends MetadataModel {

    public static createModelsFromDescribe(objDescribe: any): Array<TriggerModel> {

        let models = [];

        console.log(objDescribe);

        return models;
    }

    public filterObject(): boolean {
        return false;
    }

    public doesHaveBypasser(bypasserName: string): boolean {
        return false;
    }
}