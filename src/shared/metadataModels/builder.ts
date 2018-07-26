import { UX, Org, Connection } from '@salesforce/core'; 
import { MetadataModel } from  './base';

export class MetadataModelBuilder {

    private METADATA_READ_MAX_SIZE = 10;

    private conn: Connection;
    private totalObjs: number;

    constructor(public ux: UX, public org: Org, public metadataType: string) {}

    public async fetchAndCreateMetadataModels(objectsToFiler: Array<string>, creatorMethod: (objDescribes: Array<any>, builder: MetadataModelBuilder, additionalInfo?: any) => Promise<Array<MetadataModel>>, additionalInfo?: any): Promise<Array<MetadataModel>> {

        this.totalObjs = 0;
        this.conn = await this.org.getConnection();

        const sobjs = objectsToFiler.length ? objectsToFiler : await this.getSobjectsToSearch();

        const objGroups = this.getObjSubgroups(sobjs);
        
        const describers = await this.getObjectDescribers(objGroups);
        
        const models = await this.createModelsFromDescribers(describers, creatorMethod, additionalInfo);

        return 
    } 

     /**
     * Obtain sobjects to check from the destination org
     */
    private async getSobjectsToSearch(): Promise<Array<string>> {

        const types = [{ type: this.metadataType, folder: null }];

        this.ux.startSpinner('Getting available objects');
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
            for (let i = 0; i < this.METADATA_READ_MAX_SIZE && this.totalObjs < objData.length; i++) {
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
     */
    private async getObjectDescribers(objGroups: Array<Array<string>>): Promise<Array<any>> {
        
        let loopCounter = 0;
        let describers = [];

        this.ux.startSpinner('Getting objects details');
        for (const objGroup of objGroups) {

            loopCounter += objGroup.length;

            this.ux.setSpinnerStatus(`${loopCounter}/${this.totalObjs}`);

            let objDescribes = await this.conn.metadata.read(this.metadataType, objGroup);
            
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
     * Create model instances from obtained describers
     * @param describers - object describers to transform to models
     * @param creatorMethod - creator static method from model classes to create instances based on describers
     * @param additionalInfo - additional info to be passed to the creator method
     */
    private async createModelsFromDescribers(describers: Array<any>, creatorMethod: (objDescribes: Array<any>, builder: MetadataModelBuilder, additionalInfo?: any) => Promise<Array<MetadataModel>>, additionalInfo: any): Promise<Array<MetadataModel>> {

        let models = [];
            
        const createdModels = await creatorMethod(describers, this, additionalInfo);

        for (let model of createdModels) {
            models.push(model);
        }

        return models;
    }
}