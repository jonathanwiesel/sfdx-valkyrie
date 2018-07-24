import { SfdxCommand } from '@salesforce/command';
import { BypasserScanner } from '../../../shared/bypasserScanner';

export default class BypassProcess extends SfdxCommand {

    public static description = 'Scan for bypassers in processes';
    public static examples = [`
sfdx vlk:bypasser:process -u someOrg
sfdx vlk:bypasser:process -u someOrg -o Account,Contact
sfdx vlk:bypasser:process -u someOrg -n Other_Bypasser_Name__c
    `];

    protected static requiresUsername = true;
    protected static requiresProject = false;
    protected static flagsConfig = {
        objects: { char: 'o', type: 'string', description: 'search in specified objects. Separate by comma if many' },
        name: { char: 'n', type: 'string', description: 'specify the bypasser name to search. Bypasser__c is the default' }
    };

    public async run(): Promise<any> {

        let bypasserScanner = new BypassProcessImpl(this.flags, this.ux, this.org);

        await bypasserScanner.exec();
    }
}

class BypassProcessImpl extends BypasserScanner {

    protected functionalName = 'processes';
    protected metadataObj = 'FlowDefinition';
    protected metadataPropertyToCheck = '';
    
    private activeProcesses = [];
    private normalizedObjects = [];

    constructor(protected flags: any, protected ux, protected org) {
        super();
    }


    /**
     * Override for main orchestrator
     */
    public async exec(): Promise<void> {

        await this.init();

        if (this.flags.objects) {
            this.normalizedObjects = this.flags.objects.split(',').map(item => item.toLowerCase());
        }

        const sobjs = await this.getSobjectsToSearch();
        let objGroups = this.getObjSubgroups(sobjs);

        await this.getAndProcessDetailObjects(objGroups);

        this.totalObjs = 0;
        objGroups = this.getObjSubgroups(this.activeProcesses);
        
        this.metadataObj = 'Flow';
        await this.getAndProcessDetailObjects(objGroups);

        await this.printResult();
    }

    /**
     * Override for main object detail processor
     * @param objsDescribe - object description to be analyzed
     */
    protected processObjectDescriptions(objsDescribe: Array<any>): void {

        switch (this.metadataObj) {
            case 'FlowDefinition':
                this.determineActiveProcesses(objsDescribe);
                break;
            case 'Flow':
                this.analizeProcess(objsDescribe);
                break;
            default:
                break;
        }
    }

    /**
     * Determine if the process is active and add it to the list
     * @param objsDescribe - object description to be analized
     */
    private determineActiveProcesses(objsDescribe: Array<any>): void {

        for (let objDescribe of objsDescribe) {
            if (objDescribe.activeVersionNumber) {
                this.activeProcesses.push(`${objDescribe.fullName}-${objDescribe.activeVersionNumber}`);
            }
        }  
    }


    /**
     * Analize the process desciption to determine bypasser presence
     * @param objsDescribe - object description to be analized
     */
    private analizeProcess(objsDescribe: Array<any>): void {
        
        let sobj: string;

        for (let objDescribe of objsDescribe) {
            
            sobj = this.getRelatedSObj(objDescribe);

            if (!this.normalizedObjects.length || this.normalizedObjects.includes(sobj.toLowerCase())) {

                this.activeRules++;

                if (!this.doesHaveBypasser(objDescribe)) {
                    objDescribe.sobj = sobj;
                    this.invalidRules.push(objDescribe);
                }
            }
        }
    }


    /**
     * Obtain the related object to the process
     * @param objDescribe - object desciprion to be analized
     */
    private getRelatedSObj(objDescribe: any): string {

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

    
    /**
     * Determine if the process has a bypasser
     * @param objDescribe - object description to be analized
     */
    protected doesHaveBypasser(objDescribe: any): boolean {
        
        const bypassVar = this.getBypasserRefVariable(objDescribe);

        let decisions = objDescribe.decisions;

        if (!(decisions instanceof Array)) {
            decisions = [decisions];
        }

        return bypassVar && this.decisionIncludesVariable(decisions, bypassVar);
    }


    /**
     * Obtain the process variable that houses the bypasser
     * @param objDescribe - object description to be analized
     */
    private getBypasserRefVariable(objDescribe: any): string {

        let bypasserVar: string;
        
        let formulas;

        if (objDescribe.formulas) {

            formulas = objDescribe.formulas;

            if (!(formulas instanceof Array)) {
                formulas = [formulas];
            }

            for (let formula of formulas) {

                if (formula.expression && formula.expression.toLowerCase().indexOf(`$setup.${this.bypasserName}`) >= 0) {
                    
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