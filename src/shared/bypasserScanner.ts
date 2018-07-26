import { UX } from '@salesforce/core'; 
import { MetadataModel } from  './metadataModels/base';

export class BypasserScanner {

    private DEFAULT_BYPASSER = 'bypasser__c';

    private activeObjs = 0;
    private invalidObjs = [];
    
    constructor(private ux: UX, private bypasserName: string, private functionalName: string, private relatedSObjsToFilter: Array<string> = []) {

        if (!this.bypasserName) {
            this.bypasserName = this.DEFAULT_BYPASSER;
        }

        this.bypasserName = this.bypasserName.toLowerCase();

        this.ux.styledHeader(`Looking for ${this.functionalName} with "${this.bypasserName}" bypasser in ${this.relatedSObjsToFilter.length ? this.relatedSObjsToFilter.join(',') : 'all objects'}`);
    }

    /** 
     * Routing method that orchestrates the logic 
     */
    public async exec(models: Array<MetadataModel>): Promise<void> {

        for (let model of models) {

            if (model.filterObject()) {

                this.activeObjs++;

                if (!model.doesHaveBypasser(this.bypasserName)) {
                    this.invalidObjs.push(model);
                }
            }
        }


        await this.printResult();
    } 

    /**
     * Print the results found
     */
    private async printResult(): Promise<void> {

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
    
}