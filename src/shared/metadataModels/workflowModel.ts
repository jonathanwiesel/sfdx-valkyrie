import { MetadataModel } from './base';

export class WorkflowModel extends MetadataModel {

    public static createModelsFromDescribe(objDescribe: any): Array<WorkflowModel> {

        let models = [];

        if (objDescribe.rules) {

            let rules = objDescribe.rules;

            if (!(rules instanceof Array)) {
                rules = [rules];
            }

            for (let rule of rules) {
                models.push(new WorkflowModel(objDescribe.fullName, rule));
            }
        }

        return models;
    }

    public filterObject(): boolean {
        return this.objMetadata.active === 'true' && this.objMetadata.fullName.indexOf('__') === -1;
    }

    public doesHaveBypasser(bypasserName: string): boolean {
        return this.objMetadata.formula && this.objMetadata.formula.toLowerCase().indexOf(`$setup.${bypasserName}`) >= 0;
    }
}