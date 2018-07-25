import { MetadataModel } from './base';

export class ApexClassModel extends MetadataModel {

    public static createModelsFromDescribe(objDescribe: any): Array<ApexClassModel> {

        let models = [];


        return models;
    }

    public filterObject(): boolean {
        return false;
    }

    public doesHaveBypasser(bypasserName: string): boolean {
        return false;
    }
}