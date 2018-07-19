import { SfdxCommand } from '@salesforce/command';

export default class ValidRules extends SfdxCommand {

    public static description = 'Scan for bypassers in validation rules';
    public static examples = [`
sfdx vlk:bypasser:validrules -u someOrg
sfdx vlk:bypasser:validrules -u someOrg -o Account,Contact
sfdx vlk:bypasser:validrules -u someOrg -n Other_Bypasser_Name__c
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

        this.ux.startSpinner('Getting sobjects details');
        for (const sobjGroup of sobjGroups) {

            loopCounter += sobjGroup.length;
            
            this.ux.setSpinnerStatus(`${loopCounter}/${this.totalSObjs}`);

            let objsDescribe = await conn.metadata.read('CustomObject', sobjGroup);

            if (!(objsDescribe instanceof Array)) {
                objsDescribe = [objsDescribe];
            }

            this.processObjectDescriptions(objsDescribe);
        }

        this.ux.stopSpinner();

        this.ux.styledHeader(`There are ${this.invalidRules.length}/${this.activeRules} active, non-managed, validation rules without bypassers.`);

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

        const types = [{ type: 'CustomObject', folder: null }];

        this.ux.startSpinner('Getting available sobjects...');
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
     * Check the validation rules from the object description
     * @param objsDescribe - object description information from the Metadata API
     */
    private processObjectDescriptions(objsDescribe: Array<any>): void {

        for (let objDescribe of objsDescribe) {

            if (objDescribe['validationRules'] && objDescribe['validationRules'].length) {

                for (let validationRule of objDescribe['validationRules']) {

                    if (validationRule.active === 'true' && validationRule.fullName.indexOf('__') === -1) {

                        this.activeRules++;

                        if (!this.doesHaveBypasser(validationRule)) {
                            validationRule.sobj = objDescribe.fullName;
                            this.invalidRules.push(validationRule);
                        }
                    }
                }
            }
        }
    }


    /**
     * Determine if the validation rule does have the bypasser
     * @param validationRule - validation rule Metadata object
     */
    private doesHaveBypasser(validationRule: any): boolean {
        return validationRule.errorConditionFormula.toLowerCase().indexOf(`$setup.${this.bypasserName}`) >= 0;
    }
}