import { MetadataModel } from './base';
import { MetadataModelBuilder } from './builder';

export class ValidationRuleModel extends MetadataModel {

    public static metadataObj = 'CustomObject'; 
    public static functionalName = 'validation rules';

    public static async createModelsFromDescribe(objDescribes: Array<any>, builder: MetadataModelBuilder): Promise<Array<ValidationRuleModel>> {

        let models = [];

        for (let objDescribe of objDescribes) {

            if (objDescribe.validationRules) {

                let rules = objDescribe.validationRules;

                if (!(rules instanceof Array)) {
                    rules = [rules];
                }

                for (let rule of rules) {
                    models.push(new ValidationRuleModel(objDescribe.fullName, rule));
                }
            }
        }

        return models;
    }

    public filterObject(): boolean {
        return this.objMetadata.active === 'true' && this.objMetadata.fullName.indexOf('__') === -1;
    }

    public doesHaveBypasser(bypasserName: string): boolean {
        return this.objMetadata.errorConditionFormula.toLowerCase().indexOf(`$setup.${bypasserName}`) >= 0;
    }
}