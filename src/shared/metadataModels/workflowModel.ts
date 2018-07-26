import { MetadataModel } from './base';
import { MetadataModelBuilder } from './builder';

export class WorkflowModel extends MetadataModel {

    public static metadataObj = 'Workflow'; 
    public static functionalName = 'workflow rules';

    public static async createModelsFromDescribe(objDescribes: Array<any>, builder: MetadataModelBuilder): Promise<Array<WorkflowModel>> {

        let models = [];

        for (let objDescribe of objDescribes) {

            if (objDescribe.rules) {

                let rules = objDescribe.rules;

                if (!(rules instanceof Array)) {
                    rules = [rules];
                }

                for (let rule of rules) {
                    models.push(new WorkflowModel(objDescribe.fullName, rule));
                }
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