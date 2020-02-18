import { MetadataModel } from './base';
import { MetadataModelBuilder } from './builder';

export class ProcessDefinitionModel extends MetadataModel {

    public static metadataObj = 'FlowDefinition'; 
    public static functionalName = 'process definitions';

    public static async createModelsFromDescribe(objDescribes: Array<any>, builder: MetadataModelBuilder, filteringObjects: Array<string> = []): Promise<Array<MetadataModel>> {
        
        let activeProcesses = [];

        for (let objDescribe of objDescribes) {
            if (objDescribe.activeVersionNumber) {
                activeProcesses.push(`${objDescribe.fullName}-${objDescribe.activeVersionNumber}`);
            }
        }

        const secondBuilder = new MetadataModelBuilder(builder.ux, builder.org, ProcessModel);

        const models = await secondBuilder.fetchAndCreateMetadataModels(activeProcesses, filteringObjects);

        return models;
    }

    public filterObject(): boolean {
        return false;
    }

    public doesHaveBypasser(bypasserName: string): boolean {
        return false;
    }
}


export class ProcessModel extends MetadataModel {

    public static metadataObj = 'Flow'; 
    public static functionalName = 'processes';

    public static async createModelsFromDescribe(objDescribes: Array<any>, builder: MetadataModelBuilder, filteringObjects: Array<string> = []): Promise<Array<ProcessModel>> {
        
        let models = [];
        let sobj: string;

        for (let objDescribe of objDescribes) {

            if (objDescribe.processType === 'Workflow') {

                sobj = ProcessModel.getRelatedSObj(objDescribe);
        
                models.push(new ProcessModel(sobj, objDescribe, filteringObjects));
            }
        }
        
        return models;
    }


    constructor(sobjName: any, objMetadata: any, private filteringObjects: Array<string>) {
        super(sobjName, objMetadata, objMetadata.fullName);
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