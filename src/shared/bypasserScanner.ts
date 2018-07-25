import { UX, Org, Connection } from '@salesforce/core'; 
import { MetadataModel } from  './metadataModels/base';

export abstract class BypasserScanner {

    private DEFAULT_BYPASSER = 'bypasser__c';
    private METADATA_READ_MAX_SIZE = 10;

    protected totalObjs = 0;
    protected activeObjs = 0;
    protected invalidObjs = [];

    protected abstract metadataObj: string;
    protected abstract functionalName: string; 

    protected conn: Connection;
    
    constructor(protected ux: UX, protected org: Org, protected bypasserName: string, protected objectsToFiler: Array<string> = [], protected relatedSObjsToFilter: Array<string> = []) {

        if (!this.bypasserName) {
            this.bypasserName = this.DEFAULT_BYPASSER;
        }

        this.bypasserName = this.bypasserName.toLowerCase();
    }

    protected async init() {

        this.ux.styledHeader(`Looking for ${this.functionalName} with "${this.bypasserName}" bypasser in ${this.relatedSObjsToFilter.length ? this.relatedSObjsToFilter.join(',') : 'all objects'}`);

        this.conn = await this.org.getConnection();
    }

    /** 
     * Routing method that orchestrates the logic 
     */
    public async exec(): Promise<void> {

        await this.init();

        const sobjs = this.objectsToFiler.length ? this.objectsToFiler : await this.getSobjectsToSearch();

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

        let models: Array<MetadataModel>;

        for (let objDescribe of objsDescribe) {
            models = this.analizeObject(objDescribe);

            for (let model of models) {

                if (model.filterObject()) {

                    this.activeObjs++;

                    if (!model.doesHaveBypasser(this.bypasserName)) {
                        this.invalidObjs.push(model);
                    }
                }
            }
        }
    }

    /**
     * Print the results found
     */
    protected async printResult(): Promise<void> {

        this.ux.styledHeader(`There are ${this.invalidObjs.length}/${this.activeObjs} active, non-managed, ${this.functionalName} without bypassers.`);
        
        if (this.invalidObjs.length && await this.ux.confirm('Want to see the detail?')) {

            this.ux.table(this.invalidObjs, {
                columns: [
                    { key: 'sobjName' },
                    { key: 'metadataName' }
                ]
            });
        }
    }

    /**
     * Analize the object and should determine the precense of a bypasser
     * @param rule - obj description being evaluated
     */
    protected abstract analizeObject(objDescribe: any): Array<MetadataModel>;
    
}