import { UX, Org, Connection } from '@salesforce/core'; 

export abstract class BypasserScanner {

    private DEFAULT_BYPASSER = 'bypasser__c';
    private METADATA_READ_MAX_SIZE = 10;

    protected totalObjs = 0;
    protected activeRules = 0;
    protected invalidRules = [];
    protected bypasserName: string;

    protected abstract ux: UX;
    protected abstract org: Org;

    protected abstract flags: any;
    protected abstract metadataObj: string;
    protected abstract functionalName: string; 
    protected abstract metadataPropertyToCheck: string

    protected conn: Connection;
    
    protected async init(): Promise<void> {

        this.bypasserName = this.flags.name || this.DEFAULT_BYPASSER;
        this.bypasserName = this.bypasserName.toLowerCase();

        this.ux.styledHeader(`Looking for ${this.functionalName} with "${this.bypasserName}" bypasser in ${this.flags.objects || 'all objects'}`);

        this.conn = await this.org.getConnection();
    } 

    /** 
     * Routing method that orchestrates the logic 
     */
    public async exec(): Promise<void> {

        await this.init();

        const sobjs = this.flags.objects ? this.flags.objects.split(',') :
                        await this.getSobjectsToSearch();

        const objGroups = this.getObjSubgroups(sobjs);

        await this.getAndProcessDetailObjects(objGroups);

        await this.printResult();
    } 
    
    /** 
     * Obtain detail objects and process them 
     * @param objGroups - groups to get detail from
     */
    protected async getAndProcessDetailObjects(objGroups: Array<Array<string>>): Promise<void> {
        
        let loopCounter = 0;

        this.ux.startSpinner('Getting objects details');
        for (const objGroup of objGroups) {

            loopCounter += objGroup.length;

            this.ux.setSpinnerStatus(`${loopCounter}/${this.totalObjs}`);

            let objsDescribe = await this.conn.metadata.read(this.metadataObj, objGroup);

            if (!(objsDescribe instanceof Array)) {
                objsDescribe = [objsDescribe];
            }

            this.processObjectDescriptions(objsDescribe);
        }

        this.ux.stopSpinner();
    }

    /**
     * Obtain sobjects to check from the destination org
     */
    protected async getSobjectsToSearch(): Promise<Array<string>> {

        const types = [{ type: this.metadataObj, folder: null }];

        this.ux.startSpinner('Getting available objects');
        const sobjsData = await this.conn.metadata.list(types, await this.org.retrieveMaxApiVersion());
        this.ux.stopSpinner();

        return sobjsData.map(item => item.fullName);
    }


    /**
     * Separate sobjects to look in smaller groups wince the describe API only supports 10 objects at a time
     * @param objData - objects to get detail from
     */
    protected getObjSubgroups(objData: Array<string>): Array<Array<string>> {

        let objGroups = [];

        while (this.totalObjs < objData.length) {

            let objGroup = [];
            for (let i = 0; i < this.METADATA_READ_MAX_SIZE && this.totalObjs < objData.length; i++) {
                objGroup.push(objData[this.totalObjs]);
                this.totalObjs++;
            }

            objGroups.push(objGroup);
        }

        return objGroups;
    }


    /**
     * Check the validation rules from the object description
     * @param objsDescribe - object description information from the Metadata API
     */
    protected processObjectDescriptions(objsDescribe: Array<any>): void {

        let rules;

        for (let objDescribe of objsDescribe) {
            
            if (objDescribe[this.metadataPropertyToCheck]) {

                rules = objDescribe[this.metadataPropertyToCheck];

                if (!(rules instanceof Array)) {
                    rules = [rules];
                }

                for (let rule of rules) {

                    if (this.filterRule(rule)) {

                        this.activeRules++;

                        if (!this.doesHaveBypasser(rule)) {
                            rule.sobj = objDescribe.fullName;
                            this.invalidRules.push(rule);
                        }
                    }
                }
            }
        }
    }

    /**
     * Determine if a rule should be further evaluated
     * @param rule - rule being evaluated
     */
    protected filterRule(rule: any): boolean {
        return rule.active === 'true' && rule.fullName.indexOf('__') === -1;
    }


    /**
     * Print the results found
     */
    protected async printResult(): Promise<void> {

        this.ux.styledHeader(`There are ${this.invalidRules.length}/${this.activeRules} active, non-managed, ${this.functionalName} without bypassers.`);
        
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
     * Determine if the rule does have the bypasser
     * @param rule - rule Metadata object
     */
    protected abstract doesHaveBypasser(rule: any): boolean;
    
}