import { MetadataModel } from './base';

export class ValidationRuleModel extends MetadataModel {

    public static createModelsFromDescribe(objDescribe: any): Array<ValidationRuleModel> {

        let models = [];

        if (objDescribe.validationRules) {

            let rules = objDescribe.validationRules;

            if (!(rules instanceof Array)) {
                rules = [rules];
            }

            for (let rule of rules) {
                models.push(new ValidationRuleModel(objDescribe.fullName, rule));
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