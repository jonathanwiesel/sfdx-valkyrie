import { Org, Connection, Messages } from '@salesforce/core';
import { UX } from '@salesforce/command';  
import { MetadataModel } from  './base';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('sfdx-valkyrie', 'valkyrie');

export class MetadataModelBuilder {

    private METADATA_READ_MAX_SIZE = 10;

    private conn: Connection;
    private totalObjs: number;

    constructor(public ux: UX, public org: Org, public metadataModel: any) {}

    public async fetchAndCreateMetadataModels(objectsToFiler: Array<string>, additionalInfo?: any): Promise<Array<MetadataModel>> {

        this.totalObjs = 0;
        this.conn = await this.org.getConnection();

        const sobjs = objectsToFiler.length ? objectsToFiler : await this.getSobjectsToSearch();

        const objGroups = this.getObjSubgroups(sobjs);
        
        const describers = await this.getObjectDescribers(objGroups);
        
        const models = await this.metadataModel.createModelsFromDescribe(describers, this, additionalInfo);

        return models;
    } 

     /**
     * Obtain sobjects to check from the destination org
     */
    private async getSobjectsToSearch(): Promise<Array<string>> {

        const types = [{ type: this.metadataModel.metadataObj, folder: null }];

        this.ux.startSpinner(messages.getMessage('gettingObjsMsg'));
        const sobjsData = await this.conn.metadata.list(types, await this.org.retrieveMaxApiVersion());
        this.ux.stopSpinner();

        return sobjsData.map(item => item.fullName);
    }


    /**
     * Separate sobjects to look in smaller groups wince the describe API only supports 10 objects at a time
     * @param objData - objects to get detail from
     */
    private getObjSubgroups(objData: Array<string>): Array<Array<string>> {

        let objGroups = [];

        while (this.totalObjs < objData.length) {

            let objGroup = [];
            for (let i = 0; (this.metadataModel.toolingApiConfig !== undefined || i < this.METADATA_READ_MAX_SIZE) && this.totalObjs < objData.length; i++) {
                objGroup.push(objData[this.totalObjs]);
                this.totalObjs++;
            }

            objGroups.push(objGroup);
        }

        return objGroups;
    }


    /** 
     * Obtain detail objects and process them 
     * @param objGroups - groups to get detail from
     * @param useToolingApi - wether the tooling api should be used depending on the type being fetched
     */
    private async getObjectDescribers(objGroups: Array<Array<string>>): Promise<Array<any>> {
        
        let loopCounter = 0;
        let describers = [];

        this.ux.startSpinner(messages.getMessage('gettingObjDetailsMsg'));
        for (const objGroup of objGroups) {

            loopCounter += objGroup.length;

            this.ux.setSpinnerStatus(`${loopCounter}/${this.totalObjs}`);

            let objDescribes = await (this.metadataModel.toolingApiConfig === undefined ? 
                                this.conn.metadata.read(this.metadataModel.metadataObj, objGroup) :
                                this.retrieveObjectData(objGroup));
            
            if (!(objDescribes instanceof Array)) {
                objDescribes = [objDescribes];
            }
            
            for (let objDescribe of objDescribes) {
                describers.push(objDescribe);
            }
        }

        this.ux.stopSpinner();

        return describers;
    }


    /**
     * Retrieve objects data via the Tooling API
     * @param objGroup - group to get detail from
     */
    private async retrieveObjectData(objGroup: Array<string>): Promise<any> {

        return new Promise((resolve, reject) => {

            this.conn.tooling.sobject(this.metadataModel.metadataObj)
                .find(this.metadataModel.toolingApiConfig.filter(objGroup), this.metadataModel.toolingApiConfig.fields)
                .execute(null, function(err, records) {
                    if (err) reject(err);
                    else resolve(records); 
                });
        });
    }
}