import { SfdxCommand } from '@salesforce/command';

export default class BypassWorkflowRules extends SfdxCommand {

    public static description = 'Scan for bypassers in workflow rules';
    public static examples = [`
sfdx vlk:bypasser:workflows -u someOrg
sfdx vlk:bypasser:workflows -u someOrg -o Account,Contact
sfdx vlk:bypasser:workflows -u someOrg -n Other_Bypasser_Name__c
    `];

    protected static requiresUsername = true;
    protected static requiresProject = false;
    protected static flagsConfig = {
        objects: {char: 'o', type: 'string', description: 'search in specified objects. Separate by comma if many'},
        name: {char: 'n', type: 'string', description: 'specify the bypasser name to search. Bypasser__c is the default'}
    };


    private DEFAULT_BYPASSER = 'bypasser__c';
    private METADATA_READ_MAX_SIZE = 10;

    private totalSObjs = 0;
    private activeRules = 0;
    private invalidRules = [];
    private bypasserName: string;

    public async run(): Promise<any> {

        this.bypasserName = this.flags.name || this.DEFAULT_BYPASSER;
        this.bypasserName = this.bypasserName.toLowerCase();

        this.ux.styledHeader(`Looking for "${this.bypasserName}" bypasser in ${this.flags.objects || 'all objects'}`);

        const conn = await this.org.getConnection();

        const sobjs = this.flags.objects ? this.flags.objects.split(',') :
                    await this.getSobjectsToSearch(conn);
        
        const sobjGroups = this.getSObjSubgroups(sobjs);

        let loopCounter = 0;

        this.ux.startSpinner('Getting workflow details');
        for (const sobjGroup of sobjGroups) {

            loopCounter += sobjGroup.length;
            
            this.ux.setSpinnerStatus(`${loopCounter}/${this.totalSObjs}`);

            let objsDescribe = await conn.metadata.read('Workflow', sobjGroup);

            if (!(objsDescribe instanceof Array)) {
                objsDescribe = [objsDescribe];
            }

            this.processObjectDescriptions(objsDescribe);
        }

        this.ux.stopSpinner();

        this.ux.styledHeader(`There are ${this.invalidRules.length}/${this.activeRules} active, non-managed, workflow rules without bypassers.`);

        if (this.invalidRules.length && await this.ux.confirm('Want to see the detail?')) {

            this.ux.table(this.invalidRules, {
                columns: [
                    { key: 'sobj' },
                    { key: 'fullName' }
                ]
            });
        }
    }


    /**
     * Obtain sobjects to check from the destination org
     * @param conn - connection object
     */
    private async getSobjectsToSearch(conn): Promise<Array<string>> {

        const types = [{ type: 'Workflow', folder: null }];

        this.ux.startSpinner('Getting sobjects with workflows');
        const sobjsData = await conn.metadata.list(types, await this.org.retrieveMaxApiVersion());
        this.ux.stopSpinner();

        return sobjsData.map(item => item.fullName);
    }


    /**
     * Separate sobjects to look in smaller groups wince the describe API only supports 10 objects at a time
     * @param sobjData - sobjects to get detail from
     */
    private getSObjSubgroups(sobjData: Array<string>): Array<Array<string>> {

        let sobjGroups = [];

        while (this.totalSObjs < sobjData.length) {
            
            let sobjGroup = [];
            for (let i = 0; i < this.METADATA_READ_MAX_SIZE && this.totalSObjs < sobjData.length; i++) {
                sobjGroup.push(sobjData[this.totalSObjs]);
                this.totalSObjs++;
            }

            sobjGroups.push(sobjGroup);
        }

        return sobjGroups;
    }


    /**
     * Check the workflow rules from the object description
     * @param objsDescribe - object description information from the Metadata API
     */
    private processObjectDescriptions(objsDescribe: Array<any>): void {

        let rules;

        for (let objDescribe of objsDescribe) {

            if (objDescribe['rules']) {
                
                rules = objDescribe['rules'];

                if (!(rules instanceof Array)) {
                    rules = [rules];
                }

                for (let workflowRule of rules) {

                    if (workflowRule.active === 'true' && workflowRule.fullName.indexOf('__') === -1) {

                        this.activeRules++;

                        if (!this.doesHaveBypasser(workflowRule)) {
                            workflowRule.sobj = objDescribe.fullName;
                            this.invalidRules.push(workflowRule);
                        }
                    }
                }
            }
        }
    }


    /**
     * Determine if the workflow rule does have the bypasser
     * @param workflowRule - workflow rule Metadata object
     */
    private doesHaveBypasser(workflowRule: any): boolean {
        return workflowRule.formula && workflowRule.formula.toLowerCase().indexOf(`$setup.${this.bypasserName}`) >= 0;
    }
}