import { MetadataModel } from './base';

export class ProcessModel extends MetadataModel {

    public static createModelsFromDescribe(objDescribe: any, normalizedObjects: Array<string>): Array<ProcessModel> {
        
        let models = [];

        const sobj = ProcessModel.getRelatedSObj(objDescribe);
        
        models.push(new ProcessModel(sobj, objDescribe, normalizedObjects));

        return models;
    }

    constructor(sobjName: any, objMetadata: any, private filteringObjects: Array<string>) {
        super(sobjName, objMetadata);
    }

    /**
     * Obtain the related object to the process
     * @param objDescribe - object desciprion to be analized
     */
    private static getRelatedSObj(objDescribe: any): string {

        let res: string;

        if (objDescribe.processMetadataValues instanceof Array) {
            
            for (let metaVal of objDescribe.processMetadataValues) {

                if (metaVal.name === 'ObjectType' && 
                    metaVal.value && metaVal.value.stringValue) {
                    
                    res = metaVal.value.stringValue;
                    break;
                }
            }
        }

        return res;
    }


    public filterObject(): boolean {
        return this.filteringObjects.length === 0 || this.filteringObjects.includes(this.sobjName.toLowerCase());
    }


    /**
     * Determine if the process has a bypasser
     * @param objDescribe - object description to be analized
     */
    public doesHaveBypasser(bypasserName: string): boolean {
        
        const bypassVar = this.getBypasserRefVariable(bypasserName);

        let decisions = this.objMetadata.decisions;

        if (!(decisions instanceof Array)) {
            decisions = [decisions];
        }

        return bypassVar && this.decisionIncludesVariable(decisions, bypassVar);
    }


    /**
     * Obtain the process variable that houses the bypasser
     * @param objDescribe - object description to be analized
     */
    private getBypasserRefVariable(bypasserName: string): string {

        let bypasserVar: string;
        
        let formulas;

        if (this.objMetadata.formulas) {

            formulas = this.objMetadata.formulas;

            if (!(formulas instanceof Array)) {
                formulas = [formulas];
            }

            for (let formula of formulas) {

                if (formula.expression && formula.expression.toLowerCase().indexOf(`$setup.${bypasserName}`) >= 0) {
                    
                    bypasserVar = formula.name;
                    break;
                }
            }
        }

        return bypasserVar;
    }

    /**
     * Determine if a decision nodes in a process reference the supplied variable
     * @param decisions - process decision nodes to check
     * @param varToCheck - bypasser variable to check for existence
     */
    private decisionIncludesVariable(decisions: Array<any>, varToCheck: string): boolean {

        let rules;
        let conditions;

        for (let decision of decisions) {

            if (decision.rules) {

                rules = decision.rules;

                if (!(rules instanceof Array)) {
                    rules = [rules];
                }

                for (let rule of rules) {

                    if (rule.conditions) {

                        conditions = rule.conditions;

                        if (!(conditions instanceof Array)) {
                            conditions = [conditions];
                        }

                        for (let condition of conditions) {

                            if (condition.leftValueReference === varToCheck) {
                                return true;
                            }                        
                        }
                    }
                }
            }
        }

        return false;
    }
}